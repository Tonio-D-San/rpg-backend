import { Module } from '@nestjs/common';

import { JwtAuthGuard } from './guard/jwt-auth.guard.js';
import { PlatformGroupGuard } from './guard/platform-group.guard.js';
import { JwtVerifierService } from './service/jwt-verifier.service.js';

@Module({
  providers: [
    JwtVerifierService,
    JwtAuthGuard,
    PlatformGroupGuard,
  ],
  exports: [
    JwtVerifierService,
    JwtAuthGuard,
    PlatformGroupGuard,
  ],
})
export class AuthModule {}
