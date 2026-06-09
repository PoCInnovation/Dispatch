import type { SQL } from 'drizzle-orm';
import { asc, desc } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export type SortableMap = Record<string, PgColumn>;

/**
 * Picks the column to sort on from a whitelist, falling back to a default
 * when the requested key is missing/unknown. Returns the wrapped asc/desc
 * SQL fragment ready to pass to `.orderBy()`.
 */
export function resolveOrderBy(
  columns: SortableMap,
  sort: string | undefined,
  order: 'asc' | 'desc' | undefined,
  fallback: PgColumn,
): SQL {
  const column = sort && sort in columns ? columns[sort] : fallback;
  return order === 'desc' ? desc(column) : asc(column);
}
