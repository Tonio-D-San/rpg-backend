export function getEnvironmentFile(): string {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}
