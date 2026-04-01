export async function register() {
  const { isMocked } = await import('@/lib/mock');
  if (isMocked()) console.log('[server] Mock mode: ON');
}
