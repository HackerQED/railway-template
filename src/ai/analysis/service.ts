import { Buffer } from 'node:buffer';
import { SEGMENT_DURATION, buildJsonSchema, buildPrompt } from './prompt';
import type { MusicAnalysis } from './types';

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) return trimmed;
  const match = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (match?.[1]) return match[1].trim();
  const braceStart = trimmed.indexOf('{');
  const braceEnd = trimmed.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }
  return trimmed;
}

async function fetchAudioAsBase64(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch audio: ${res.status} ${res.statusText}`);
    }
    const bytes = await res.arrayBuffer();
    const maxBytes = 15 * 1024 * 1024;
    if (bytes.byteLength > maxBytes) {
      throw new Error(
        `Audio file too large: ${bytes.byteLength} bytes (max ${maxBytes})`
      );
    }
    return Buffer.from(bytes).toString('base64');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGemini(
  base64Audio: string,
  duration: number
): Promise<MusicAnalysis> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const baseUrl =
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const segmentCount = Math.ceil(duration / SEGMENT_DURATION);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
  }

  const body = {
    model: 'google/gemini-3.1-pro-preview',
    temperature: 0.3,
    max_tokens: 8000,
    response_format: {
      type: 'json_schema',
      json_schema: buildJsonSchema(segmentCount),
    },
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: buildPrompt(duration) },
          {
            type: 'input_audio',
            input_audio: {
              data: base64Audio,
              format: 'mp3',
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      data?.error?.message || `OpenRouter error: ${response.status}`;
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  let rawText: string;

  if (typeof content === 'string') {
    rawText = content;
  } else if (Array.isArray(content)) {
    rawText = content
      .map((part: { type?: string; text?: string }) =>
        part?.type === 'text' ? part.text : ''
      )
      .filter(Boolean)
      .join('\n');
  } else {
    throw new Error('No analysis content returned from OpenRouter');
  }

  const jsonStr = extractJson(rawText);
  const analysis = JSON.parse(jsonStr) as MusicAnalysis;
  return sanitizeSegments(analysis);
}

function sanitizeSegments(analysis: MusicAnalysis): MusicAnalysis {
  const MIN_SEGMENT_DURATION = 0.5;
  const filtered = analysis.segments.filter(
    (seg) => seg.endTime - seg.startTime >= MIN_SEGMENT_DURATION
  );
  if (filtered.length === analysis.segments.length) return analysis;

  const segments = filtered.map((seg, i) => ({ ...seg, index: i }));
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    if (last.endTime < analysis.duration) {
      segments[segments.length - 1] = { ...last, endTime: analysis.duration };
    }
  }

  return { ...analysis, segments };
}

export async function analyzeMusic(
  musicUrl: string,
  duration: number
): Promise<MusicAnalysis> {
  const { isMocked } = await import('@/lib/mock');
  if (isMocked()) {
    return mockAnalysis(duration);
  }
  const base64Audio = await fetchAudioAsBase64(musicUrl);
  return callGemini(base64Audio, duration);
}

function mockAnalysis(duration: number): MusicAnalysis {
  const SEGMENT_DURATION = 8;
  const segmentCount = Math.ceil(duration / SEGMENT_DURATION);
  const mockTexts = [
    'Section: Intro\nEnergy: 6/10\nMood & Emotion: Upbeat, Anticipatory\n\nInstrumentation & Arrangement: Twangy electric guitar, acoustic guitars, walking bassline, drum kit.\n\nRhythm & Dynamics: Lively mid-tempo 4/4 groove.\n\nVocal & Emotion: No vocals.\n\nLyrics: No lyrics\n\nTransition Points: @0.0s: Drum fill. @0.5s: Full band enters.',
    'Section: Verse 1\nEnergy: 7/10\nMood & Emotion: Narrative, Casual\n\nInstrumentation & Arrangement: Guitar steps back for vocals. Bass and drums maintain groove.\n\nRhythm & Dynamics: Consistent 4/4 country beat.\n\nVocal & Emotion: Male vocalist, conversational storytelling.\n\nLyrics: Well I walked in the diner / Hungry as can be\n\nTransition Points: @9.5s: Vocal enters.',
  ];

  const segments = Array.from({ length: segmentCount }, (_, i) => ({
    index: i,
    startTime: i * SEGMENT_DURATION,
    endTime: Math.min((i + 1) * SEGMENT_DURATION, duration),
    text: mockTexts[i % mockTexts.length],
  }));

  return {
    title: 'Mock Track — Diner Hunger',
    duration,
    bpm: 125,
    key: 'A Major',
    mood: 'Upbeat, narrative, casual',
    genre: 'Country, Honky Tonk',
    energy: 'medium',
    summary:
      '[MOCK] An upbeat country track. Set MOCK=false for real analysis.',
    lyrics: 'Well I walked in the diner / Hungry as can be',
    segments,
  };
}
