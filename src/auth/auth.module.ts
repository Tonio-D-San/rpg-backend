import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guard/jwt-auth.guard.js';
import { JwtVerifierService } from './service/jwt-verifier.service.js';

@Module({
  providers: [
    JwtVerifierService,
    JwtAuthGuard,
  ],
  exports: [
    JwtVerifierService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
