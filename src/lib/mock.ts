export function isMocked(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.MOCK === 'true';
  }
  return process.env.MOCK !== 'false';
}
