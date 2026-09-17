import { SetMetadata } from '@nestjs/common';
import type { GroupCode } from '../../groups/model/group-code.js';

export const REQUIRED_GROUP_KEY = 'waystone:required-group';
export const RequireGroup = (group: GroupCode) => SetMetadata(REQUIRED_GROUP_KEY, group);
