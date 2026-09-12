import { GroupCode } from '../model/group-code.js';

export const PLATFORM_GROUPS = [
  {
    code: GroupCode.PLATFORM_USERS,
    path: '/platform-users',
  },
  {
    code: GroupCode.PLATFORM_ADMINS,
    path: '/platform-admins',
  },
] as const;
