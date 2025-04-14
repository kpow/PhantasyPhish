export interface ScoringBreakdown {
  totalScore: number;
  songInShow: { count: number, points: number }; // 3 points each
  songInSet: { count: number, points: number };  // 6 points each
  correctSong: { count: number, points: number }; // 10 points each
  correctSpecial: { count: number, points: number }; // 15 points each (opener, closer, encore)
  encoreInSet: { count: number, points: number }; // 10 points each
  details: Array<{
    songName: string;
    predictedSet: string;
    predictedPosition: number;
    actualSet?: string;
    actualPosition?: number;
    points: number;
    reason: string;
  }>;
}

export interface ProcessedSetlist {
  set1: Array<{ name: string; position: number }>;
  set2: Array<{ name: string; position: number }>;
  encore: Array<{ name: string; position: number }>;
}

export interface SetlistItem {
  position: number;
  song: {
    id: string | number;
    name: string;
    slug?: string;
    times_played?: number;
  } | null;
}