import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Decode an audio File into an AudioBuffer using Web Audio API.
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }
}

/**
 * Get the duration (in seconds) of an audio File.
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(audio.src);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio metadata'));
    });
    audio.src = URL.createObjectURL(file);
  });
}

/**
 * Convert a Float32Array of audio samples to Int16Array for lamejs.
 */
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * Clip an AudioBuffer from startTime to endTime and encode as MP3.
 * Returns a File object with the clipped MP3.
 */
export async function clipAndEncodeMP3(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  fileName = 'clip.mp3'
): Promise<File> {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const length = endSample - startSample;

  const encoder = new Mp3Encoder(channels, sampleRate, 128);
  const mp3Data: Uint8Array[] = [];

  const left = floatTo16BitPCM(
    audioBuffer.getChannelData(0).subarray(startSample, endSample)
  );
  const right =
    channels > 1
      ? floatTo16BitPCM(
          audioBuffer.getChannelData(1).subarray(startSample, endSample)
        )
      : undefined;

  // Encode in chunks of 1152 samples (MP3 frame size)
  const CHUNK_SIZE = 1152;
  for (let i = 0; i < length; i += CHUNK_SIZE) {
    const leftChunk = left.subarray(i, i + CHUNK_SIZE);
    const rightChunk = right?.subarray(i, i + CHUNK_SIZE);
    const mp3buf =
      channels > 1
        ? encoder.encodeBuffer(leftChunk, rightChunk)
        : encoder.encodeBuffer(leftChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const end = encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
  return new File([blob], fileName, { type: 'audio/mpeg' });
}
