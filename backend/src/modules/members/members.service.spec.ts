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

import { MembersService } from './members.service';

describe('MembersService', () => {
  let service: MembersService;
  let db: MockDb;

  const orgId = 'org_123';
  const memberId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    db = createMockDb();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: DRIZZLE, useValue: asDatabase(db) },
      ],
    }).compile();
    service = module.get(MembersService);
  });

  describe('create', () => {
    it('inserts and returns the member when email is free', async () => {
      const member = {
        id: memberId,
        organizationId: orgId,
        email: 'pablo@acme.com',
        fullName: 'Pablo',
      };
      db.select.mockReturnValueOnce(chainResolve([]));
      db.insert.mockReturnValueOnce(chainResolve([member]));

      const result = await service.create(orgId, {
        email: 'pablo@acme.com',
        fullName: 'Pablo',
      });

      expect(result).toEqual(member);
    });

    it('throws ConflictException when email exists in the org', async () => {
      db.select.mockReturnValueOnce(chainResolve([{ id: 'existing' }]));

      await expect(
        service.create(orgId, { email: 'pablo@acme.com', fullName: 'Pablo' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated active members scoped to org', async () => {
      const members = [{ id: memberId, organizationId: orgId, isActive: true }];
      db.select.mockReturnValueOnce(chainResolve(members));
      db.select.mockReturnValueOnce(chainResolve([{ value: 1 }]));

      const result = await service.findAll(orgId, {
        page: 1,
        limit: 20,
        order: 'asc',
      });

      expect(result.data).toEqual(members);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns the member when found', async () => {
      const member = { id: memberId, organizationId: orgId };
      db.select.mockReturnValueOnce(chainResolve([member]));

      const result = await service.findOne(orgId, memberId);

      expect(result).toEqual(member);
    });

    it('throws NotFoundException when missing', async () => {
      db.select.mockReturnValueOnce(chainResolve([]));

      await expect(service.findOne(orgId, memberId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates and returns the member', async () => {
      const member = { id: memberId, organizationId: orgId, fullName: 'Old' };
      const updated = { ...member, fullName: 'New' };
      db.select.mockReturnValueOnce(chainResolve([member]));
      db.update.mockReturnValueOnce(chainResolve([updated]));

      const result = await service.update(orgId, memberId, { fullName: 'New' });

      expect(result).toEqual(updated);
    });

    it('clears userId when set to null', async () => {
      const member = {
        id: memberId,
        organizationId: orgId,
        userId: 'user_123',
      };
      const updated = { ...member, userId: null };
      db.select.mockReturnValueOnce(chainResolve([member]));
      db.update.mockReturnValueOnce(chainResolve([updated]));

      const result = await service.update(orgId, memberId, { userId: null });

      expect(result.userId).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('sets isActive=false', async () => {
      const member = { id: memberId, organizationId: orgId, isActive: true };
      const deleted = { ...member, isActive: false };
      db.select.mockReturnValueOnce(chainResolve([member]));
      db.update.mockReturnValueOnce(chainResolve([deleted]));

      const result = await service.softDelete(orgId, memberId);

      expect(result.isActive).toBe(false);
    });
  });
});
