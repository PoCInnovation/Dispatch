import { Injectable, Logger, Inject } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

import {
  codebaseOwnership,
  type CodebaseOwnershipRow,
} from '../../database/schema/codebase';

import { members } from '../../database/schema';
import { DRIZZLE } from '../../database/database.module';

const execFileAsync = promisify(execFile);

const HALF_LIFE_DAYS = 180;

const GIT_FIELD_SEPARATOR = '\x00';


export interface ContributorWeight {
  contributorName: string;
  weightPercentage: number;
}

export interface OwnershipResult {
  filePath: string;
  contributors: ContributorWeight[];
  analyzedAt: Date;
}

interface RawCommit {
  authorName: string;
  date: Date;
}

export interface MemberRef {
  id: number;
  name: string;
  email: string;
  gitName?: string | null;
  gitEmail?: string | null;
}

export interface ResolvedOwner {
  contributorName: string;
  weightPercentage: number;
  member: MemberRef | null;
}


export class GitCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitCommandError';
  }
}

export class PathNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathNotFoundError';
  }
}


@Injectable()
export class CodebaseService {
  private readonly logger = new Logger(CodebaseService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase,
  ) {}

  async analyzeOwnership(repoRoot: string, targetPath: string): Promise<OwnershipResult> {
    const resolvedTarget = path.resolve(repoRoot, targetPath);
    const relativePath = path.relative(repoRoot, resolvedTarget);

    await this.assertPathExists(resolvedTarget);

    const commits = await this.fetchGitHistory(repoRoot, relativePath);

    if (commits.length === 0) {
      this.logger.warn(`Aucun commit Git trouvé pour : ${relativePath}`);
      return { filePath: relativePath, contributors: [], analyzedAt: new Date() };
    }

    const weighted = this.computeWeightedContributions(commits);
    const contributors = this.normalizeToPercentage(weighted);

    await this.upsertOwnership(relativePath, contributors);

    return { filePath: relativePath, contributors, analyzedAt: new Date() };
  }

  async getStoredOwnership(filePath: string): Promise<CodebaseOwnershipRow[]> {
    return this.db
      .select()
      .from(codebaseOwnership)
      .where(eq(codebaseOwnership.filePath, filePath))
      .orderBy(codebaseOwnership.weightPercentage);
  }

  async getPrimaryOwner(filePath: string): Promise<CodebaseOwnershipRow | null> {
    const rows = await this.db
      .select()
      .from(codebaseOwnership)
      .where(eq(codebaseOwnership.filePath, filePath))
      .orderBy(desc(codebaseOwnership.weightPercentage))
      .limit(1);

    return rows[0] ?? null;
  }

  private async fetchGitHistory(repoRoot: string, relativePath: string): Promise<RawCommit[]> {
    let stdout: string;
    try {
      ({ stdout } = await execFileAsync(
        'git',
        [
          'log',
          '--follow',
          '--diff-filter=ACDMRT',
          `--pretty=format:%an${GIT_FIELD_SEPARATOR}%ad`,
          '--date=iso-strict',
          '--',
          relativePath,
        ],
        { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
      ));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GitCommandError(`Échec de git log pour "${relativePath}" dans "${repoRoot}": ${message}`);
    }

    return this.parseGitLog(stdout);
  }

  private parseGitLog(raw: string): RawCommit[] {
    const commits: RawCommit[] = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const sepIdx = trimmed.indexOf(GIT_FIELD_SEPARATOR);
      if (sepIdx === -1) continue;

      const authorName = trimmed.slice(0, sepIdx).trim();
      const dateStr = trimmed.slice(sepIdx + 1).trim();
      const date = new Date(dateStr);

      if (!authorName || isNaN(date.getTime())) continue;
      commits.push({ authorName, date });
    }
    return commits;
  }

  private decayCoefficient(commitDate: Date, now: Date): number {
    const ageInDays = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.pow(2, -ageInDays / HALF_LIFE_DAYS);
  }

  private computeWeightedContributions(commits: RawCommit[]): Map<string, number> {
    const now = new Date();
    const scores = new Map<string, number>();
    for (const { authorName, date } of commits) {
      const coefficient = this.decayCoefficient(date, now);
      scores.set(authorName, (scores.get(authorName) ?? 0) + coefficient);
    }
    return scores;
  }

  private normalizeToPercentage(scores: Map<string, number>): ContributorWeight[] {
    const total = [...scores.values()].reduce((sum, v) => sum + v, 0);
    if (total === 0) return [];
    return [...scores.entries()]
      .map(([contributorName, score]) => ({
        contributorName,
        weightPercentage: parseFloat(((score / total) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.weightPercentage - a.weightPercentage);
  }

  private async upsertOwnership(filePath: string, contributors: ContributorWeight[]): Promise<void> {
    const now = new Date();
    const incomingNames = new Set(contributors.map((c) => c.contributorName));

    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select({ contributorName: codebaseOwnership.contributorName })
        .from(codebaseOwnership)
        .where(eq(codebaseOwnership.filePath, filePath));

      for (const { contributorName } of existing) {
        if (!incomingNames.has(contributorName)) {
          await tx
            .delete(codebaseOwnership)
            .where(
              and(
                eq(codebaseOwnership.filePath, filePath),
                eq(codebaseOwnership.contributorName, contributorName),
              ),
            );
        }
      }

      for (const { contributorName, weightPercentage } of contributors) {
        await tx
          .insert(codebaseOwnership)
          .values({ filePath, contributorName, weightPercentage, updatedAt: now })
          .onConflictDoUpdate({
            target: [codebaseOwnership.filePath, codebaseOwnership.contributorName],
            set: { weightPercentage, updatedAt: now },
          });
      }
    });

    this.logger.log(`Ownership mis à jour pour "${filePath}" — ${contributors.length} contributeur(s)`);
  }

  private async assertPathExists(absolutePath: string): Promise<void> {
    try {
      await fs.access(absolutePath);
    } catch {
      throw new PathNotFoundError(`Chemin introuvable : "${absolutePath}"`);
    }
  }
}


@Injectable()
export class GitMemberResolverService {
  private readonly logger = new Logger(GitMemberResolverService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase,
  ) {}

  async resolveMembers(
    contributors: Array<{ contributorName: string; weightPercentage: number }>,
  ): Promise<ResolvedOwner[]> {
    if (contributors.length === 0) return [];

    const names = contributors.map((c) => c.contributorName);

    if (names.length === 0) return contributors.map((c) => ({ ...c, member: null }));

    const conditions = [
      ...names.map((n) => ilike(members.gitName, n)),
      ...names.map((n) => ilike(members.name, n)),
    ];

    const rows = await this.db
      .select()
      .from(members)
      .where(or(...conditions));

    const memberIndex = this.buildMemberIndex(rows as unknown as MemberRef[]);

    return contributors.map((contributor) => ({
      ...contributor,
      member: this.lookupMember(memberIndex, contributor.contributorName),
    }));
  }

  private buildMemberIndex(rows: MemberRef[]): Map<string, MemberRef> {
    const index = new Map<string, MemberRef>();
    for (const member of rows) {
      if (member.gitName) {
        index.set(member.gitName.toLowerCase(), member);
      }
      if (!index.has(member.name.toLowerCase())) {
        index.set(member.name.toLowerCase(), member);
      }
    }
    return index;
  }

  private lookupMember(index: Map<string, MemberRef>, contributorName: string): MemberRef | null {
    return index.get(contributorName.toLowerCase()) ?? null;
  }
}