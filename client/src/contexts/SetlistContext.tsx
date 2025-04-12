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
  addSongToSet: (set: 'set1' | 'set2' | 'encore') => void;
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
  addSongToSet: () => {},
  clearSetlist: () => {}
});

interface SetlistProviderProps {
  children: ReactNode;
}

export function SetlistProvider({ children }: SetlistProviderProps) {
  // Initialize setlist with 4 spots in each set
  const initialSetlist = {
    set1: Array(4).fill(0).map((_, i) => ({ position: i, song: null })),
    set2: Array(4).fill(0).map((_, i) => ({ position: i, song: null })),
    encore: Array(2).fill(0).map((_, i) => ({ position: i, song: null }))
  };

  const [setlist, setSetlist] = useState(initialSetlist);
  const [selectedSong, setSelectedSong] = useState<PhishSong | null>(null);

  // Maximum number of songs allowed per set
  const MAX_SET_SIZE = 15;

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

  const addSongToSet = (set: 'set1' | 'set2' | 'encore') => {
    setSetlist(prev => {
      // Only add a new spot if we're under the maximum
      if (prev[set].length >= MAX_SET_SIZE) {
        return prev;
      }
      
      // Create a new setlist spot at the next position
      const newPosition = prev[set].length;
      const newSpot = { position: newPosition, song: null };
      
      return {
        ...prev,
        [set]: [...prev[set], newSpot]
      };
    });
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
      addSongToSet,
      clearSetlist
    }}>
      {children}
    </SetlistContext.Provider>
  );
}
