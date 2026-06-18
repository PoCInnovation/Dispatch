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

import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let db: MockDb;

  const orgId = 'org_123';
  const roleId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    db = createMockDb();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: DRIZZLE, useValue: asDatabase(db) }],
    }).compile();
    service = module.get(RolesService);
  });

  describe('create', () => {
    it('inserts and returns the role when name is free in this org', async () => {
      const role = { id: roleId, organizationId: orgId, name: 'tech-lead' };
      db.select.mockReturnValueOnce(chainResolve([]));
      db.insert.mockReturnValueOnce(chainResolve([role]));

      const result = await service.create(orgId, { name: 'tech-lead' });

      expect(result).toEqual(role);
    });

    it('throws ConflictException when name already exists in this org', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: 'existing' }]));

      await expect(
        service.create(orgId, { name: 'tech-lead' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated roles scoped to the org', async () => {
      const roles = [{ id: roleId, organizationId: orgId, name: 'owner' }];
      db.select.mockReturnValueOnce(chainResolve(roles));
      db.select.mockReturnValueOnce(chainResolve([{ value: 1 }]));

      const result = await service.findAll(orgId, {
        page: 1,
        limit: 20,
        order: 'asc',
      });

      expect(result.data).toEqual(roles);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns the role when found in this org', async () => {
      const role = { id: roleId, organizationId: orgId, name: 'owner' };
      db.select.mockReturnValueOnce(chainResolve([role]));

      const result = await service.findOne(orgId, roleId);

      expect(result).toEqual(role);
    });

    it('throws NotFoundException when missing (or in another org)', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(service.findOne(orgId, roleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates and returns the role', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'tech-lead',
        isDefault: false,
      };
      const updated = { ...role, name: 'lead' };
      db.select.mockReturnValueOnce(chainResolve([role]));
      db.select.mockReturnValueOnce(chainResolve([{ id: roleId }]));
      db.update.mockReturnValueOnce(chainResolve([updated]));

      const result = await service.update(orgId, roleId, { name: 'lead' });

      expect(result).toEqual(updated);
    });

    it('throws ConflictException when renaming to an existing name in this org', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'tech-lead',
        isDefault: false,
      };
      db.select.mockReturnValueOnce(chainResolve([role]));
      db.select.mockReturnValueOnce(chainResolve([{ id: 'other-role' }]));

      await expect(
        service.update(orgId, roleId, { name: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when trying to rename a default role', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'owner',
        isDefault: true,
      };
      db.select.mockReturnValueOnce(chainResolve([role]));

      await expect(
        service.update(orgId, roleId, { name: 'lead' }),
      ).rejects.toThrow(ConflictException);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('allows updating the description of a default role', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'owner',
        isDefault: true,
      };
      const updated = { ...role, description: 'New description' };
      db.select.mockReturnValueOnce(chainResolve([role]));
      db.update.mockReturnValueOnce(chainResolve([updated]));

      const result = await service.update(orgId, roleId, {
        description: 'New description',
      });

      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('deletes the role when unused', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'tech-lead',
        isDefault: false,
      };
      db.select.mockReturnValueOnce(chainResolve([role])); // findOne
      db.select.mockReturnValueOnce(chainResolve([])); // usage check
      db.delete.mockReturnValueOnce(chainResolve(undefined));

      await expect(service.remove(orgId, roleId)).resolves.toBeUndefined();
      expect(db.delete).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when trying to delete a default role', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'owner',
        isDefault: true,
      };
      db.select.mockReturnValueOnce(chainResolve([role])); // findOne

      await expect(service.remove(orgId, roleId)).rejects.toThrow(
        ConflictException,
      );
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException when role is assigned to team members', async () => {
      const role = {
        id: roleId,
        organizationId: orgId,
        name: 'tech-lead',
        isDefault: false,
      };
      db.select.mockReturnValueOnce(chainResolve([role])); // findOne
      db.select.mockReturnValueOnce(chainResolve([{ id: 'tm_1' }])); // usage exists

      await expect(service.remove(orgId, roleId)).rejects.toThrow(
        ConflictException,
      );
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when role is missing in this org', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(service.remove(orgId, roleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
