import { NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import type { MockDb } from '../../common/testing/drizzle-mock';
import {
  asDatabase,
  chainResolve,
  createMockDb,
} from '../../common/testing/drizzle-mock';
import { DRIZZLE } from '../../database/database.module';

import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let db: MockDb;

  const orgId = 'org_123';
  const teamId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    db = createMockDb();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamsService, { provide: DRIZZLE, useValue: asDatabase(db) }],
    }).compile();
    service = module.get(TeamsService);
  });

  describe('create', () => {
    it('inserts and returns the created team', async () => {
      const team = { id: teamId, organizationId: orgId, name: 'Backend' };
      db.insert.mockReturnValueOnce(chainResolve([team]));

      const result = await service.create(orgId, {
        name: 'Backend',
        description: 'desc',
      });

      expect(result).toEqual(team);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('returns paginated active teams scoped to org', async () => {
      const teams = [{ id: teamId, organizationId: orgId, name: 'Backend' }];
      db.select.mockReturnValueOnce(chainResolve(teams));
      db.select.mockReturnValueOnce(chainResolve([{ value: 1 }]));

      const result = await service.findAll(orgId, {
        page: 1,
        limit: 20,
        order: 'asc',
      });

      expect(result).toEqual({
        data: teams,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns the team when found', async () => {
      const team = { id: teamId, organizationId: orgId, name: 'Backend' };
      db.select.mockReturnValueOnce(chainResolve([team]));

      const result = await service.findOne(orgId, teamId);

      expect(result).toEqual(team);
    });

    it('throws NotFoundException when missing', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(service.findOne(orgId, teamId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates and returns the team', async () => {
      const team = { id: teamId, organizationId: orgId, name: 'Backend' };
      const updated = { ...team, name: 'New' };
      db.select.mockReturnValueOnce(chainResolve([team]));
      db.update.mockReturnValueOnce(chainResolve([updated]));

      const result = await service.update(orgId, teamId, { name: 'New' });

      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when team is missing', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(
        service.update(orgId, teamId, { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets isActive=false', async () => {
      const team = { id: teamId, organizationId: orgId, isActive: true };
      const deleted = { ...team, isActive: false };
      db.select.mockReturnValueOnce(chainResolve([team]));
      db.update.mockReturnValueOnce(chainResolve([deleted]));

      const result = await service.softDelete(orgId, teamId);

      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException when team is missing', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(service.softDelete(orgId, teamId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
