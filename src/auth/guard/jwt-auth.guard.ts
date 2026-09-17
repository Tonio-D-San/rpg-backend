import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {Request} from 'express';

import {JwtVerifierService} from '../service/jwt-verifier.service.js';
import {AuthenticatedRequest} from '../type/authenticated-request.type.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtVerifierService: JwtVerifierService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    try {
      (request as AuthenticatedRequest).user = await this.jwtVerifierService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) {
      return null;
    }

    const match = RegExp(/^Bearer\s+(.+)$/i).exec(authorization);
    if (!match?.[1]) {
      return null;
    }
    return match[1];
  }
}
