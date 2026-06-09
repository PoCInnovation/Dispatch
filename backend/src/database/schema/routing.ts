import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { organization, user } from './auth';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('teams_organization_id_idx').on(table.organizationId)],
);

export const members = pgTable(
  'members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('members_org_email_uidx').on(table.organizationId, table.email),
    index('members_organization_id_idx').on(table.organizationId),
  ],
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('roles_org_name_uidx').on(table.organizationId, table.name),
    index('roles_organization_id_idx').on(table.organizationId),
  ],
);

export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('team_members_team_member_uidx').on(
      table.teamId,
      table.memberId,
    ),
    index('team_members_team_id_idx').on(table.teamId),
    index('team_members_member_id_idx').on(table.memberId),
  ],
);

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organization, {
    fields: [teams.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMembers),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  organization: one(organization, {
    fields: [members.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [members.userId],
    references: [user.id],
  }),
  teamMemberships: many(teamMembers),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organization, {
    fields: [roles.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  member: one(members, {
    fields: [teamMembers.memberId],
    references: [members.id],
  }),
  role: one(roles, {
    fields: [teamMembers.roleId],
    references: [roles.id],
  }),
}));
