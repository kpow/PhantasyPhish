import React, { createContext, useState, ReactNode, useContext } from "react";
import { PhishSong, SetlistItem, PhishShow } from "@/types";
import { ScoringBreakdown, ProcessedSetlist } from '@shared/types';

interface ScoringData {
  breakdown: ScoringBreakdown | null;
  actualSetlist: ProcessedSetlist | null;
  showDetails: {
    date: string;
    venue: string;
    location: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

interface SetlistContextType {
  setlist: {
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  };
  selectedSong: PhishSong | null;
  selectedShow: PhishShow | null;
  scoringMode: boolean;
  scoringData: ScoringData;
  setSelectedSong: (song: PhishSong | null) => void;
  setSelectedShow: (show: PhishShow | null) => void;
  setScoringData: (data: ScoringData) => void;
  setSetlistSpot: (
    set: "set1" | "set2" | "encore",
    position: number,
    song: PhishSong | null,
  ) => void;
  addSongToSet: (set: "set1" | "set2" | "encore") => void;
  reorderSongs: (
    set: "set1" | "set2" | "encore",
    oldIndex: number,
    newIndex: number,
  ) => void;
  clearSetlist: () => void;
  resetSetlistAndShow: () => void;
  loadPredictionForShow: (showId: string) => Promise<boolean>;
  deletePredictionForShow: (showId: string) => Promise<boolean>;
  scorePrediction: (predictionId: number) => Promise<boolean>;
  toggleScoringMode: () => void;
  setSetlist: React.Dispatch<
    React.SetStateAction<{
      set1: SetlistItem[];
      set2: SetlistItem[];
      encore: SetlistItem[];
    }>
  >;
}

export const SetlistContext = createContext<SetlistContextType>({
  setlist: {
    set1: [],
    set2: [],
    encore: [],
  },
  selectedSong: null,
  selectedShow: null,
  scoringMode: false,
  scoringData: {
    breakdown: null,
    actualSetlist: null,
    showDetails: null,
    isLoading: false,
    error: null
  },
  setSelectedSong: () => {},
  setSelectedShow: () => {},
  setScoringData: () => {},
  setSetlistSpot: () => {},
  addSongToSet: () => {},
  reorderSongs: () => {},
  clearSetlist: () => {},
  resetSetlistAndShow: () => {},
  loadPredictionForShow: async () => false,
  deletePredictionForShow: async () => false,
  scorePrediction: async () => false,
  toggleScoringMode: () => {},
  // Empty function for the default value of setSetlist
  setSetlist: () => {},
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
    set1: Array(5)
      .fill(0)
      .map((_, i) => ({ position: i, song: null as PhishSong | null })),
    set2: Array(5)
      .fill(0)
      .map((_, i) => ({ position: i, song: null as PhishSong | null })),
    encore: Array(3)
      .fill(0)
      .map((_, i) => ({ position: i, song: null as PhishSong | null })),
  };

  const [setlist, setSetlist] = useState<{
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  }>(initialSetlist);
  const [selectedSong, setSelectedSong] = useState<PhishSong | null>(null);
  const [selectedShow, setSelectedShow] = useState<PhishShow | null>(null);
  const [scoringMode, setScoringMode] = useState<boolean>(false);
  const [scoringData, setScoringData] = useState<ScoringData>({
    breakdown: null,
    actualSetlist: null,
    showDetails: null,
    isLoading: false,
    error: null
  });

  const toggleScoringMode = () => {
    setScoringMode(prev => !prev);
  };

  // Score a prediction
  const scorePrediction = async (predictionId: number): Promise<boolean> => {
    try {
      setScoringData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/predictions/${predictionId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setScoringData(prev => ({
          ...prev,
          isLoading: false,
          error: errorData.message || 'Failed to score prediction'
        }));
        return false;
      }

      const data = await response.json();
      
      // Extract show details
      const showDetails = {
        date: data.prediction.show_id, // This may need to be formatted
        venue: 'Unknown Venue', // We may need to fetch this separately
        location: 'Unknown Location'
      };
      
      // Try to fetch show details if available
      try {
        const showResponse = await fetch(`/api/shows/details/${data.prediction.show_id}`);
        if (showResponse.ok) {
          const showData = await showResponse.json();
          showDetails.date = showData.showdate;
          showDetails.venue = showData.venue;
          showDetails.location = showData.location;
        }
      } catch (e) {
        console.error("Error fetching show details:", e);
      }
      
      setScoringData({
        breakdown: data.breakdown,
        actualSetlist: data.actualSetlist,
        showDetails,
        isLoading: false,
        error: null
      });
      
      // Enter scoring mode
      setScoringMode(true);
      
      return true;
    } catch (error) {
      console.error("Error scoring prediction:", error);
      setScoringData(prev => ({
        ...prev,
        isLoading: false,
        error: 'An unexpected error occurred while scoring the prediction'
      }));
      return false;
    }
  };



  const setSetlistSpot = (
    set: "set1" | "set2" | "encore",
    position: number,
    song: PhishSong | null,
  ) => {
    if (song === null) {
      // If removing a song, remove the entire item from the array
      setSetlist((prev) => {
        // Filter out the item at the specified position
        const newSetItems = prev[set].filter(item => item.position !== position);
        
        // Update the positions of the remaining items
        const updatedItems = newSetItems.map((item, index) => ({
          ...item,
          position: index,
        }));
        
        return {
          ...prev,
          [set]: updatedItems,
        };
      });
    } else {
      // If adding a song, update the existing slot
      setSetlist((prev) => ({
        ...prev,
        [set]: prev[set].map((item) =>
          item.position === position ? { ...item, song } : item,
        ),
      }));
    }

    // Clear the selected song after adding it
    setSelectedSong(null);
  };

  const addSongToSet = (set: "set1" | "set2" | "encore") => {
    // Define maximum size based on the set type
    const maxSize = set === "encore" ? 3 : 8;

    // Count total items (including empty slots)
    const totalItems = setlist[set].length;
    
    // Check if we're already at the maximum
    if (totalItems >= maxSize) {
      return; // Do nothing if we've reached the limit
    }

    // Create a new spot object
    const newPosition = totalItems;
    const newSpot: SetlistItem = {
      position: newPosition,
      song: null as PhishSong | null,
    };

    // Create a completely new setlist object to ensure React re-renders
    const newSetArray = [...setlist[set], newSpot];

    // Update state with the new setlist
    setSetlist({
      ...setlist,
      [set]: newSetArray,
    });
  };

  // Function to reorder songs within a set
  const reorderSongs = (
    set: "set1" | "set2" | "encore",
    oldIndex: number,
    newIndex: number,
  ) => {
    // Create a new array for the specific set
    const items = [...setlist[set]];

    // Remove the item from its old position
    const [removedItem] = items.splice(oldIndex, 1);

    // Add the item at its new position
    items.splice(newIndex, 0, removedItem);

    // Update the position property of each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    // Update the setlist
    setSetlist({
      ...setlist,
      [set]: updatedItems,
    });
  };

  const clearSetlist = () => {
    setSetlist(initialSetlist);
    setSelectedSong(null);
  };

  const resetSetlistAndShow = () => {
    setSetlist(initialSetlist);
    setSelectedSong(null);
    setSelectedShow(null);
  };

  // Load prediction for a specific show
  const loadPredictionForShow = async (showId: string): Promise<boolean> => {
    try {
      // First check if we have a prediction for this show
      const response = await fetch(`/api/users/current/predictions/${showId}`);

      if (response.ok) {
        const data = await response.json();

        if (data.prediction) {
          // Format the prediction data to match our setlist format
          const predictionSetlist = {
            set1: Array(5)
              .fill(0)
              .map((_, i) => ({
                position: i,
                song: null as PhishSong | null,
              })),
            set2: Array(5)
              .fill(0)
              .map((_, i) => ({
                position: i,
                song: null as PhishSong | null,
              })),
            encore: Array(3)
              .fill(0)
              .map((_, i) => ({
                position: i,
                song: null as PhishSong | null,
              })),
          };

          // Parse the JSON string stored in the database
          const setlistData = data.prediction.setlist;

          // Map the songs into the right format
          if (setlistData.set1 && Array.isArray(setlistData.set1)) {
            predictionSetlist.set1 = setlistData.set1.map(
              (songData: any, index: number) => ({
                position: index,
                song: songData
                  ? {
                      id: songData.id,
                      name: songData.name,
                      slug: "", // We may not have this info
                      times_played: 0, // We may not have this info
                    }
                  : null,
              }),
            );
          }

          if (setlistData.set2 && Array.isArray(setlistData.set2)) {
            predictionSetlist.set2 = setlistData.set2.map(
              (songData: any, index: number) => ({
                position: index,
                song: songData
                  ? {
                      id: songData.id,
                      name: songData.name,
                      slug: "", // We may not have this info
                      times_played: 0, // We may not have this info
                    }
                  : null,
              }),
            );
          }

          if (setlistData.encore && Array.isArray(setlistData.encore)) {
            predictionSetlist.encore = setlistData.encore.map(
              (songData: any, index: number) => ({
                position: index,
                song: songData
                  ? {
                      id: songData.id,
                      name: songData.name,
                      slug: "", // We may not have this info
                      times_played: 0, // We may not have this info
                    }
                  : null,
              }),
            );
          }

          // Update the setlist
          setSetlist(predictionSetlist);
          return true;
        }
      }

      // If we don't have a prediction or there was an error, start fresh
      clearSetlist();
      return false;
    } catch (error) {
      console.error("Error loading prediction for show:", error);
      clearSetlist();
      return false;
    }
  };
  
  // Delete prediction for a specific show
  const deletePredictionForShow = async (showId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/current/predictions/${showId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Reset the setlist to initial empty state
        clearSetlist();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error deleting prediction for show:", error);
      return false;
    }
  };

  return (
    <SetlistContext.Provider
      value={{
        setlist,
        selectedSong,
        selectedShow,
        scoringMode,
        scoringData,
        setSelectedSong,
        setSelectedShow,
        setScoringData,
        setSetlistSpot,
        addSongToSet,
        reorderSongs,
        clearSetlist,
        resetSetlistAndShow,
        loadPredictionForShow,
        deletePredictionForShow,
        scorePrediction,
        toggleScoringMode,
        setSetlist,
      }}
    >
      {children}
    </SetlistContext.Provider>
  );
}
