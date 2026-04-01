export const SEGMENT_DURATION = 8;

export function buildJsonSchema(segmentCount: number) {
  return {
    name: 'music_analysis',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A short creative title for this track',
        },
        duration: {
          type: 'number',
          description: 'Total duration in seconds',
        },
        bpm: {
          type: 'number',
          description: 'Estimated BPM (beats per minute)',
        },
        key: {
          type: 'string',
          description: 'Musical key, e.g. "C Minor", "G Major"',
        },
        mood: {
          type: 'string',
          description: 'Overall mood/emotion description',
        },
        genre: { type: 'string', description: 'Genre/style tags' },
        energy: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Overall energy level',
        },
        summary: {
          type: 'string',
          description: 'A 2-3 sentence summary of the track',
        },
        lyrics: {
          type: 'string',
          description:
            'Complete and accurate lyrics transcription of the entire track, line by line, separated by " / ". Transcribe every word exactly as sung. If purely instrumental, write "Instrumental - no lyrics"',
        },
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              startTime: { type: 'number' },
              endTime: { type: 'number' },
              text: {
                type: 'string',
                description:
                  'Detailed analysis text for this segment. Must include accurate lyrics for this time window and transition points with precise absolute timestamps from track start.',
              },
            },
            required: ['index', 'startTime', 'endTime', 'text'],
            additionalProperties: false,
          },
          minItems: segmentCount,
          maxItems: segmentCount,
        },
      },
      required: [
        'title',
        'duration',
        'bpm',
        'key',
        'mood',
        'genre',
        'energy',
        'summary',
        'lyrics',
        'segments',
      ],
      additionalProperties: false,
    },
  };
}

export function buildPrompt(duration: number): string {
  const segmentCount = Math.ceil(duration / SEGMENT_DURATION);
  const segments: string[] = [];
  for (let i = 0; i < segmentCount; i++) {
    const start = i * SEGMENT_DURATION;
    const end = Math.min((i + 1) * SEGMENT_DURATION, duration);
    segments.push(`  - Segment ${i}: ${start}s - ${end.toFixed(1)}s`);
  }

  return `You are a professional music analyst. Analyze the provided audio track and return a structured JSON response.

## Global Analysis
Provide: title, duration (${duration}s), BPM, musical key, overall mood, genre tags, energy level (low/medium/high), a 2-3 sentence summary, and full lyrics transcription (if the track has vocals, transcribe ALL lyrics exactly as sung, word-for-word, using " / " to separate lines — do not paraphrase or skip any lines; if instrumental, write "Instrumental - no lyrics").

## Segment Analysis
Divide the track into ${segmentCount} segments of ${SEGMENT_DURATION} seconds each (last segment may be shorter):
${segments.join('\n')}

IMPORTANT: If the track duration falls exactly on a segment boundary (e.g. 16s, 24s, 32s), do NOT create a zero-length stub segment — just use the segments that naturally fit.

For each segment's "text" field, use the following structured format with labeled sections. Use the exact headers shown below. IMPORTANT: Separate each section with a blank line (\\n\\n) to maintain readability.

"""
Section: <section label, e.g. Intro, Verse 1, Chorus, Bridge, Outro, Instrumental Break>
Energy: <N>/10
Mood & Emotion: <comma-separated mood tags>

Instrumentation & Arrangement: <what instruments/sounds are present, how they interact, any new elements entering or dropping out>

Rhythm & Dynamics: <tempo feel, rhythmic patterns, dynamic changes like crescendo/decrescendo, accents>

Vocal & Emotion: <vocal characteristics if any, emotional tone, lyrical themes. Write "No vocals" if instrumental>

Lyrics: <transcribe the EXACT lyrics sung in this time window, word-for-word as heard. Place lyrics in the segment where they are actually sung — do not shift to adjacent segments. Write "No lyrics" if no vocals in this segment>

Transition Points: <list moments with ABSOLUTE timestamps from track start (e.g. for segment 8s-16s, a hit at the 3rd second = "@11s", NOT "@3s"). Note: vocal entries/exits, instrument changes, dynamic shifts, drum fills. Only report what you can precisely locate. Write "No significant transitions" if none>
"""

Here is an example of a well-written segment text (for segment 0s-8s):

"""
Section: Verse 1 (Setup)
Energy: 7/10
Mood & Emotion: Narrative, Humorous

Instrumentation & Arrangement: Clean electric guitar plays a driving, slightly twangy riff as the lead instrument. A solid bass line locks in with a punchy drum beat featuring crisp snare hits and steady hi-hats. The arrangement is lean and garage-rock influenced, with no additional layers yet.

Rhythm & Dynamics: The groove is mid-tempo and head-nodding, with a consistent 4/4 beat. Dynamics are relatively flat but with a subtle push on the snare accents that creates forward momentum.

Vocal & Emotion: A male vocalist delivers deadpan, storytelling lyrics with a slightly comedic inflection. The vocal tone is dry and conversational, describing a mundane scene that builds humorous tension.

Lyrics: I only ate three cheeseburgers / And they're looking at me like I committed a crime / The waitress dropped her pad / And the cook came out just to stare

Transition Points: @0.0s: Drum fill kicks off the instrumental intro. @3.5s: Lead vocal enters, marking the start of Verse 1.
"""

Each segment text should be 100-200 words. Be specific and detailed — vague descriptions are not useful for downstream generation. Preserve the blank-line spacing between sections exactly as shown in the example above.

Return ONLY valid JSON matching the schema. No extra text or markdown.`;
}
