import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRED_GROUP_KEY } from '../decorator/require-group.decorator.js';
import { AuthenticatedRequest } from '../type/authenticated-request.type.js';
import { PLATFORM_GROUPS } from '../../groups/config/platform-groups.config.js';
import type { GroupCode } from '../../groups/model/group-code.js';

@Injectable()
export class PlatformGroupGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredGroup = this.reflector.getAllAndOverride<GroupCode>(
      REQUIRED_GROUP_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );
    if (!requiredGroup) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }
    const groupConfiguration = PLATFORM_GROUPS.find(
      (group) => group.code === requiredGroup
    );
    if (!groupConfiguration) {
      throw new Error(`Platform group '${requiredGroup}' is not configured`);
    }
    const hasRequiredGroup = request.user.groups.includes(groupConfiguration.path);
    if (!hasRequiredGroup) {
      throw new ForbiddenException('Required platform group missing');
    }
    return true;
  }
}
