import { Logger } from '@nestjs/common';

import { roles } from '../schema';
import type { Database } from '../database.module';

const DEFAULT_ROLES = [
  {
    name: 'owner',
    description: 'Owns the team and can manage every aspect of it.',
  },
  {
    name: 'manager',
    description: 'Manages the team and its members.',
  },
  {
    name: 'agent',
    description: 'Regular team member receiving routed tickets.',
  },
];

export async function seedDefaultRoles(
  db: Database,
  organizationId: string,
): Promise<void> {
  const logger = new Logger('seedDefaultRoles');

  await db
    .insert(roles)
    .values(
      DEFAULT_ROLES.map((r) => ({ ...r, organizationId, isDefault: true })),
    )
    .onConflictDoNothing({ target: [roles.organizationId, roles.name] });

  logger.log(
    `Seeded ${DEFAULT_ROLES.length} default roles for organization ${organizationId}`,
  );
}
