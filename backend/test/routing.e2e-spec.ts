import { randomUUID } from 'node:crypto';

import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';
const ORIGIN = BASE_URL;

interface Team {
  id: string;
  name: string;
  isActive: boolean;
  description?: string | null;
}

interface Member {
  id: string;
  email: string;
  fullName: string;
  userId: string | null;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
}

interface PaginatedRoles {
  data: Role[];
  total: number;
}

interface PaginatedTeams {
  data: Team[];
  total: number;
}

describe('Routing flow (e2e)', () => {
  let http: TestAgent;

  let orgId: string;
  let teamId: string;
  let memberId: string;
  let agentRoleId: string;
  let ownerRoleId: string;
  let customRoleId: string;

  const email = `e2e-${randomUUID()}@dispatch.test`;
  const password = 'super-secret-123';
  const orgSlug = `acme-${randomUUID().slice(0, 8)}`;

  beforeAll(() => {
    http = request.agent(BASE_URL).set('Origin', ORIGIN);
  });

  describe('auth bootstrap', () => {
    it('signs up a new user', async () => {
      const res = await http
        .post('/api/auth/sign-up/email')
        .send({ email, password, name: 'E2E Tester' });
      expect([200, 201]).toContain(res.status);
    });

    it('creates and activates an organization', async () => {
      const createRes = await http
        .post('/api/auth/organization/create')
        .send({ name: 'Acme E2E', slug: orgSlug });
      expect([200, 201]).toContain(createRes.status);
      const body = createRes.body as { id: string };
      orgId = body.id;
      expect(orgId).toBeTruthy();

      const setActiveRes = await http
        .post('/api/auth/organization/set-active')
        .send({ organizationId: orgId });
      expect([200, 201]).toContain(setActiveRes.status);
    });
  });

  describe('teams CRUD', () => {
    it('lists empty teams', async () => {
      const res = await http.get('/teams').expect(200);
      const body = res.body as PaginatedTeams;
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it('creates a team', async () => {
      const res = await http
        .post('/teams')
        .send({ name: 'Backend', description: 'API & infra' })
        .expect(201);
      const body = res.body as Team;
      teamId = body.id;
      expect(body.name).toBe('Backend');
      expect(body.isActive).toBe(true);
    });

    it('finds the team in the list', async () => {
      const res = await http.get('/teams').expect(200);
      const body = res.body as PaginatedTeams;
      expect(body.total).toBe(1);
      expect(body.data[0].id).toBe(teamId);
    });

    it('updates the team', async () => {
      const res = await http
        .patch(`/teams/${teamId}`)
        .send({ description: 'updated' })
        .expect(200);
      const body = res.body as Team;
      expect(body.description).toBe('updated');
    });

    it('soft-deletes the team', async () => {
      await http.delete(`/teams/${teamId}`).expect(204);

      const listRes = await http.get('/teams').expect(200);
      const body = listRes.body as PaginatedTeams;
      expect(body.total).toBe(0);
    });
  });

  describe('roles', () => {
    it('lists exactly the 3 roles seeded for this org, all marked as default', async () => {
      const res = await http.get('/roles').expect(200);
      const body = res.body as PaginatedRoles;
      expect(body.total).toBe(3);
      const names = body.data.map((r) => r.name).sort();
      expect(names).toEqual(['agent', 'manager', 'owner']);
      expect(body.data.every((r) => r.isDefault)).toBe(true);
      agentRoleId = body.data.find((r) => r.name === 'agent')!.id;
      ownerRoleId = body.data.find((r) => r.name === 'owner')!.id;
    });

    it('rejects deleting a default role with 409', async () => {
      const res = await http.delete(`/roles/${ownerRoleId}`).expect(409);
      const body = res.body as { statusCode: number; message: string };
      expect(body.statusCode).toBe(409);
      expect(body.message).toContain('default');
    });

    it('rejects renaming a default role with 409', async () => {
      const res = await http
        .patch(`/roles/${ownerRoleId}`)
        .send({ name: 'super-owner' })
        .expect(409);
      const body = res.body as { message: string };
      expect(body.message).toContain('default');
    });

    it('allows updating the description of a default role', async () => {
      const res = await http
        .patch(`/roles/${ownerRoleId}`)
        .send({ description: 'Custom org-specific description' })
        .expect(200);
      const body = res.body as Role;
      expect(body.description).toBe('Custom org-specific description');
      expect(body.name).toBe('owner');
      expect(body.isDefault).toBe(true);
    });

    it('creates a custom (non-default) role', async () => {
      const res = await http
        .post('/roles')
        .send({ name: 'tech-lead', description: 'Tech leadership role' })
        .expect(201);
      const body = res.body as Role;
      customRoleId = body.id;
      expect(body.isDefault).toBe(false);
    });
  });

  describe('members + team membership', () => {
    let liveTeamId: string;

    beforeAll(async () => {
      const res = await http
        .post('/teams')
        .send({ name: 'Frontend' })
        .expect(201);
      liveTeamId = (res.body as Team).id;
    });

    it('creates a member without a Dispatch account', async () => {
      const res = await http
        .post('/members')
        .send({
          email: `pablo-${randomUUID()}@acme.com`,
          fullName: 'Pablo Garcia',
        })
        .expect(201);
      const body = res.body as Member;
      memberId = body.id;
      expect(body.userId).toBeNull();
    });

    it('adds the member to the team with role agent', async () => {
      const res = await http
        .post(`/teams/${liveTeamId}/members`)
        .send({ memberId, roleId: agentRoleId })
        .expect(201);
      expect(res.body).toMatchObject({
        teamId: liveTeamId,
        memberId,
        roleId: agentRoleId,
      });
    });

    it('rejects deleting a (non-default) role assigned to a team member with 409', async () => {
      // First, swap the agent's role to the custom one so it's in use
      await http
        .patch(`/teams/${liveTeamId}/members/${memberId}`)
        .send({ roleId: customRoleId })
        .expect(200);

      const res = await http.delete(`/roles/${customRoleId}`).expect(409);
      const body = res.body as { statusCode: number; message: string };
      expect(body.statusCode).toBe(409);
      expect(body.message).toContain('assigned');

      // Swap back so the rest of the test flow stays consistent
      await http
        .patch(`/teams/${liveTeamId}/members/${memberId}`)
        .send({ roleId: agentRoleId })
        .expect(200);
    });

    it('lists members of the team with their role', async () => {
      const res = await http.get(`/teams/${liveTeamId}/members`).expect(200);
      const list = res.body as Array<{
        member: { id: string };
        role: { name: string };
      }>;
      expect(list).toHaveLength(1);
      expect(list[0].member.id).toBe(memberId);
      expect(list[0].role.name).toBe('agent');
    });

    it('removes the member from the team', async () => {
      await http.delete(`/teams/${liveTeamId}/members/${memberId}`).expect(204);

      const res = await http.get(`/teams/${liveTeamId}/members`).expect(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('cross-tenant safety', () => {
    it('refuses requests with no active organization (403)', async () => {
      const stranger = request.agent(BASE_URL).set('Origin', ORIGIN);
      const strangerEmail = `stranger-${randomUUID()}@dispatch.test`;

      await stranger
        .post('/api/auth/sign-up/email')
        .send({ email: strangerEmail, password, name: 'Stranger' });

      await stranger.get('/teams').expect(403);
    });

    it('isolates roles per organization (other org cannot see this org roles)', async () => {
      const otherHttp = request.agent(BASE_URL).set('Origin', ORIGIN);
      const otherEmail = `other-${randomUUID()}@dispatch.test`;
      const otherSlug = `beta-${randomUUID().slice(0, 8)}`;

      await otherHttp
        .post('/api/auth/sign-up/email')
        .send({ email: otherEmail, password, name: 'Other Tester' });

      const createRes = await otherHttp
        .post('/api/auth/organization/create')
        .send({ name: 'BetaCorp E2E', slug: otherSlug });
      const otherOrgId = (createRes.body as { id: string }).id;

      await otherHttp
        .post('/api/auth/organization/set-active')
        .send({ organizationId: otherOrgId });

      const rolesRes = await otherHttp.get('/roles').expect(200);
      const otherRoles = rolesRes.body as PaginatedRoles;

      expect(otherRoles.total).toBe(3);
      const otherIds = otherRoles.data.map((r) => r.id);
      expect(otherIds).not.toContain(agentRoleId);
    });
  });
});
