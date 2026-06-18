import { ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import type { MockDb } from '../../common/testing/drizzle-mock';
import {
  asDatabase,
  chainResolve,
  createMockDb,
} from '../../common/testing/drizzle-mock';
import { DRIZZLE } from '../../database/database.module';

import { TeamMembersService } from './team-members.service';

describe('TeamMembersService', () => {
  let service: TeamMembersService;
  let db: MockDb;

  const orgId = 'org_123';
  const teamId = '44444444-4444-4444-4444-444444444444';
  const memberId = '55555555-5555-5555-5555-555555555555';
  const roleId = '66666666-6666-6666-6666-666666666666';
  const teamMemberId = '77777777-7777-7777-7777-777777777777';

  beforeEach(async () => {
    db = createMockDb();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamMembersService,
        { provide: DRIZZLE, useValue: asDatabase(db) },
      ],
    }).compile();
    service = module.get(TeamMembersService);
  });

  describe('list', () => {
    it('returns memberships when team exists', async () => {
      const memberships = [
        {
          id: teamMemberId,
          joinedAt: new Date(),
          member: { id: memberId, email: 'p@a.com' },
          role: { id: roleId, name: 'agent' },
        },
      ];
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.select.mockReturnValueOnce(chainResolve(memberships));

      const result = await service.list(orgId, teamId);

      expect(result).toEqual(memberships);
    });

    it('throws NotFoundException when team is missing', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(service.list(orgId, teamId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('add', () => {
    it('inserts a new team membership when all entities exist', async () => {
      const created = { id: teamMemberId, teamId, memberId, roleId };
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }])); // ensureTeam
      db.select.mockReturnValueOnce(chainResolve([{ id: memberId }])); // ensureMember
      db.select.mockReturnValueOnce(chainResolve([{ id: roleId }])); // ensureRole
      db.select.mockReturnValueOnce(chainResolve([])); // no duplicate
      db.insert.mockReturnValueOnce(chainResolve([created]));

      const result = await service.add(orgId, teamId, { memberId, roleId });

      expect(result).toEqual(created);
    });

    it('throws ConflictException when member already in team', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.select.mockReturnValueOnce(chainResolve([{ id: memberId }]));
      db.select.mockReturnValueOnce(chainResolve([{ id: roleId }]));
      db.select.mockReturnValueOnce(chainResolve([{ id: teamMemberId }]));

      await expect(
        service.add(orgId, teamId, { memberId, roleId }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when team is missing', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(
        service.add(orgId, teamId, { memberId, roleId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when member is not in org', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(
        service.add(orgId, teamId, { memberId, roleId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when role does not exist', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.select.mockReturnValueOnce(chainResolve([{ id: memberId }]));
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(
        service.add(orgId, teamId, { memberId, roleId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('updates the role of a team member', async () => {
      const updated = { id: teamMemberId, teamId, memberId, roleId };
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.select.mockReturnValueOnce(chainResolve([{ id: roleId }]));
      db.update.mockReturnValueOnce(chainResolve([updated]));

      const result = await service.updateRole(orgId, teamId, memberId, {
        roleId,
      });

      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when member not in team', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.select.mockReturnValueOnce(chainResolve([{ id: roleId }]));
      db.update.mockReturnValueOnce(chainResolve([]));

      await expect(
        service.updateRole(orgId, teamId, memberId, { roleId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes the membership', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.delete.mockReturnValueOnce(chainResolve([{ id: teamMemberId }]));

      await expect(
        service.remove(orgId, teamId, memberId),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when not in team', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: teamId }]));
      db.delete.mockReturnValueOnce(chainResolve([]));

      await expect(service.remove(orgId, teamId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
