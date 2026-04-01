export interface MusicSegment {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface MusicAnalysis {
  title: string;
  duration: number;
  bpm: number;
  key: string;
  mood: string;
  genre: string;
  energy: 'low' | 'medium' | 'high';
  summary: string;
  lyrics: string;
  segments: MusicSegment[];
}
