import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AuthenticatedUserModel } from '../src/auth/model/authenticated-user.model.js';
import { PlatformGroupGuard } from '../src/auth/guard/platform-group.guard.js';
import { PLATFORM_GROUPS } from '../src/groups/config/platform-groups.config.js';
import { GroupCode } from '../src/groups/model/group-code.js';

describe('PlatformGroupGuard', () => {
  let reflector: Reflector;
  let guard: PlatformGroupGuard;
  const getRequiredGroupMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    reflector = {
      getAllAndOverride: getRequiredGroupMock,
    } as unknown as Reflector;
    guard = new PlatformGroupGuard(reflector);
  });

  function createContext(user?: AuthenticatedUserModel): ExecutionContext {
    const request = {user};
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => vi.fn(),
      getClass: () => class {},
    } as unknown as ExecutionContext;
  }

  it(
    'should allow access when no group is required',
    () => {
      getRequiredGroupMock.mockReturnValue(undefined);
      const context = createContext();
      expect(guard.canActivate(context)).toBe(true);
    },
  );

  it(
    'should reject unauthenticated user when a group is required',
    () => {
      getRequiredGroupMock.mockReturnValue(GroupCode.PLATFORM_ADMINS);
      const context = createContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    },
  );

  it(
    'should allow access when user belongs to the required group',
    () => {
      getRequiredGroupMock.mockReturnValue(GroupCode.PLATFORM_ADMINS);
      const adminGroup = PLATFORM_GROUPS.find((group) => group.code === GroupCode.PLATFORM_ADMINS);
      expect(adminGroup).toBeDefined();
      const user = new AuthenticatedUserModel(
        'test-sub',
        'admin@waystone.test',
        [adminGroup!.path],
      );
      const context = createContext(user);
      expect(guard.canActivate(context)).toBe(true);
    },
  );

  it(
    'should reject user missing the required group',
    () => {
      getRequiredGroupMock.mockReturnValue(GroupCode.PLATFORM_ADMINS);
      const user = new AuthenticatedUserModel(
        'test-sub',
        'user@waystone.test',
        [],
      );
      const context = createContext(user);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    },
  );
});
