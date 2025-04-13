import React, { createContext, useState, ReactNode, useContext } from 'react';
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
  reorderSongs: (set: 'set1' | 'set2' | 'encore', oldIndex: number, newIndex: number) => void;
  clearSetlist: () => void;
  setSetlist: React.Dispatch<React.SetStateAction<{
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  }>>;
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
  reorderSongs: () => {},
  clearSetlist: () => {},
  // Empty function for the default value of setSetlist
  setSetlist: () => {}
});

// Helper hook to use the setlist context
export const useSetlist = () => useContext(SetlistContext);

interface SetlistProviderProps {
  children: ReactNode;
}

export function SetlistProvider({ children }: SetlistProviderProps) {
  // Initialize setlist with 4 spots in each set
  const initialSetlist: {
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  } = {
    set1: Array(5).fill(0).map((_, i) => ({ position: i, song: null as PhishSong | null })),
    set2: Array(5).fill(0).map((_, i) => ({ position: i, song: null as PhishSong | null })),
    encore: Array(2).fill(0).map((_, i) => ({ position: i, song: null as PhishSong | null }))
  };

  const [setlist, setSetlist] = useState<{
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  }>(initialSetlist);
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
    // Define maximum size based on the set type
    const maxSize = set === 'encore' ? 5 : MAX_SET_SIZE;
    
    // Check if we're already at the maximum
    if (setlist[set].length >= maxSize) {
      return; // Do nothing if we've reached the limit
    }
    
    // Create a new spot object
    const newPosition = setlist[set].length;
    const newSpot: SetlistItem = { position: newPosition, song: null as PhishSong | null };
    
    // Create a completely new setlist object to ensure React re-renders
    const newSetArray = [...setlist[set], newSpot];
    
    // Update state with the new setlist
    setSetlist({
      ...setlist,
      [set]: newSetArray
    });
  };

  // Function to reorder songs within a set
  const reorderSongs = (set: 'set1' | 'set2' | 'encore', oldIndex: number, newIndex: number) => {
    // Create a new array for the specific set
    const items = [...setlist[set]];
    
    // Remove the item from its old position
    const [removedItem] = items.splice(oldIndex, 1);
    
    // Add the item at its new position
    items.splice(newIndex, 0, removedItem);
    
    // Update the position property of each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    // Update the setlist
    setSetlist({
      ...setlist,
      [set]: updatedItems
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
      reorderSongs,
      clearSetlist,
      setSetlist
    }}>
      {children}
    </SetlistContext.Provider>
  );
}
