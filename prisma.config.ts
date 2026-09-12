import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { defineConfig, env } from 'prisma/config';

const envFile = process.env.PROFILE === 'test' ? '.env.test' : '.env';
dotenvExpand.expand(dotenv.config({path: envFile}));

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {path: 'prisma/migrations'},
  datasource: {
    url: env('DATABASE_URL'),
    ...(process.env.PROFILE !== 'test' ? {shadowDatabaseUrl: env('SHADOW_DATABASE_URL')} : {}),
  },
});
