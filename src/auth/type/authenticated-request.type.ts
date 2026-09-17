import { Request } from 'express';

import { AuthenticatedUserModel } from '../model/authenticated-user.model.js';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserModel;
}
