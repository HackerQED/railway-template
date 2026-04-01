import { aivideoapiAdapter } from './providers/aivideoapi';
import { kieAdapter } from './providers/kie';
import { kieVeoAdapter } from './providers/kie-veo';
import { maxapiAdapter } from './providers/maxapi';
import { wavespeedAdapter } from './providers/wavespeed';
import type { ProviderAdapter, ProviderName } from './types';

const adapters: Record<ProviderName, ProviderAdapter> = {
  aivideoapi: aivideoapiAdapter,
  kie: kieAdapter,
  'kie-veo': kieVeoAdapter,
  maxapi: maxapiAdapter,
  wavespeed: wavespeedAdapter,
};

export function getAdapter(provider: string): ProviderAdapter {
  const adapter = adapters[provider as ProviderName];
  if (!adapter) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return adapter;
}
