export const GroupCode = {
  PLATFORM_USERS: 'PLATFORM_USERS',
  PLATFORM_ADMINS: 'PLATFORM_ADMINS',
} as const;

export type GroupCode =
  (typeof GroupCode)[keyof typeof GroupCode];
