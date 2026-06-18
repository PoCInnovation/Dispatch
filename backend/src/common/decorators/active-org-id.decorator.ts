import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithSession extends Request {
  session?: {
    session?: { activeOrganizationId?: string | null };
  } | null;
}

export const ActiveOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    const orgId = request.session?.session?.activeOrganizationId;

    if (!orgId) {
      throw new ForbiddenException('No active organization');
    }
    return orgId;
  },
);
