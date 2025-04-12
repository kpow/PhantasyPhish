export interface PhishShow {
  showid: string;
  showdate: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
}

export interface PhishSong {
  id: string;
  name: string;
  slug: string;
  times_played: number;
}

export interface SetlistItem {
  position: number;
  song: PhishSong | null;
}

export interface SetlistPrediction {
  showId: string;
  set1: SetlistItem[];
  set2: SetlistItem[];
  encore: SetlistItem[];
  created: Date;
}

export interface Setlist {
  showid: string;
  showdate: string;
  venue: string;
  location: string;
  setlistdata: string;
  setlistnotes: string;
}
