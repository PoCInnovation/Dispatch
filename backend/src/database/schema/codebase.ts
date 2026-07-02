import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const codebaseOwnership = pgTable('codebase_ownership', {
  id: uuid('id').defaultRandom().primaryKey(),
  filePath: text('file_path').notNull(),
  contributorName: text('contributor_name').notNull(),
  weightPercentage: integer('weight_percentage').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CodebaseOwnershipRow = typeof codebaseOwnership.$inferSelect;