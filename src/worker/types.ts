export type ProviderName =
  | 'kie'
  | 'kie-veo'
  | 'maxapi'
  | 'wavespeed'
  | 'aivideoapi';

/** Providers that receive results via webhook instead of polling */
export const WEBHOOK_PROVIDERS: ReadonlySet<ProviderName> = new Set(['maxapi']);

export type SubmitInput = Record<string, unknown>;

export type PollResult =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'done'; output: { urls: string[] } }
  | { status: 'failed'; error: { code: string; message: string } };

export interface ProviderAdapter {
  name: ProviderName;
  submit(input: SubmitInput): Promise<{ taskId: string }>;
  poll(taskId: string): Promise<PollResult>;
}
