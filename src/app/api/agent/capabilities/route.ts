import { CAPABILITIES } from '@/lib/api-capabilities';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  return apiSuccess(CAPABILITIES, '/api/agent/capabilities');
}
