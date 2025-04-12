import React, { createContext, useState, ReactNode } from 'react';
import { PhishSong, SetlistItem } from '@/types';

interface SetlistContextType {
  setlist: {
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  };
  selectedSong: PhishSong | null;
  setSelectedSong: (song: PhishSong | null) => void;
  setSetlistSpot: (set: 'set1' | 'set2' | 'encore', position: number, song: PhishSong | null) => void;
  clearSetlist: () => void;
}

export const SetlistContext = createContext<SetlistContextType>({
  setlist: {
    set1: [],
    set2: [],
    encore: []
  },
  selectedSong: null,
  setSelectedSong: () => {},
  setSetlistSpot: () => {},
  clearSetlist: () => {}
});

interface SetlistProviderProps {
  children: ReactNode;
}

export function SetlistProvider({ children }: SetlistProviderProps) {
  // Initialize empty setlist with position placeholders
  const initialSetlist = {
    set1: Array(5).fill(0).map((_, i) => ({ position: i, song: null })),
    set2: Array(5).fill(0).map((_, i) => ({ position: i, song: null })),
    encore: Array(2).fill(0).map((_, i) => ({ position: i, song: null }))
  };

  const [setlist, setSetlist] = useState(initialSetlist);
  const [selectedSong, setSelectedSong] = useState<PhishSong | null>(null);

  const setSetlistSpot = (set: 'set1' | 'set2' | 'encore', position: number, song: PhishSong | null) => {
    setSetlist(prev => ({
      ...prev,
      [set]: prev[set].map(item => 
        item.position === position ? { ...item, song } : item
      )
    }));
    
    // Clear the selected song after adding it
    setSelectedSong(null);
  };

  const clearSetlist = () => {
    setSetlist(initialSetlist);
    setSelectedSong(null);
  };

  return (
    <SetlistContext.Provider value={{
      setlist,
      selectedSong,
      setSelectedSong,
      setSetlistSpot,
      clearSetlist
    }}>
      {children}
    </SetlistContext.Provider>
  );
}
