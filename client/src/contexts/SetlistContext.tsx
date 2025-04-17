import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { PhishSong, SetlistItem, PhishShow } from "@/types";
import { ScoringBreakdown, ProcessedSetlist } from '@shared/types';
import { useLocation, useRoute, useRouter } from "wouter";

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
  isInScoringMode: boolean; // Changed from scoringMode to match SetlistBuilder
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
  // Added these properties to match what SetlistBuilder expects
  exitScoringMode: () => void;
  enterScoringMode: () => void;
  navigateToShow: (showId: string, scoring?: boolean) => void;
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
  isInScoringMode: false,
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
  exitScoringMode: () => {},
  enterScoringMode: () => {},
  navigateToShow: () => {},
  // Empty function for the default value of setSetlist
  setSetlist: () => {},
});

// Helper hook to use the setlist context
export const useSetlist = () => useContext(SetlistContext);

interface SetlistProviderProps {
  children: ReactNode;
}

export function SetlistProvider({ children }: SetlistProviderProps) {
  // Initialize setlist with 8 spots in sets 1 and 2, and 3 spots in encore
  const createEmptySetlist = () => ({
    set1: Array(8)
      .fill(0)
      .map((_, i) => ({ position: i, song: null as PhishSong | null })),
    set2: Array(8)
      .fill(0)
      .map((_, i) => ({ position: i, song: null as PhishSong | null })),
    encore: Array(3)
      .fill(0)
      .map((_, i) => ({ position: i, song: null as PhishSong | null })),
  });
  
  const initialSetlist = createEmptySetlist();

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
  
  // URL routing hooks
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/prediction/:showId");
  const [scoringRoute, scoringParams] = useRoute("/prediction/:showId/score");

  // Handle URL changes
  useEffect(() => {
    // Parse params from URL
    const urlShowId = params?.showId || scoringParams?.showId;
    const isScoring = !!scoringRoute;
    
    if (urlShowId) {
      // Load data for the show ID from URL
      (async () => {
        try {
          // Fetch show details
          const showResponse = await fetch(`/api/shows/details/${urlShowId}`);
          
          if (showResponse.ok) {
            const showData = await showResponse.json();
            // Set selected show in context
            setSelectedShow(showData);
            
            // Load prediction for this show
            await loadPredictionForShow(urlShowId);
            
            // If we're on the scoring route, trigger scoring mode
            if (isScoring) {
              // Find the prediction ID for this show
              const predictionsResponse = await fetch(`/api/users/current/predictions/${urlShowId}`);
              if (predictionsResponse.ok) {
                const predictionData = await predictionsResponse.json();
                if (predictionData.prediction) {
                  // Score the prediction
                  await scorePrediction(predictionData.prediction.id);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error loading from URL params:", error);
        }
      })();
    }
  }, [location]);

  // Update URL when scoring mode changes
  useEffect(() => {
    if (selectedShow) {
      const showId = selectedShow.showid;
      if (scoringMode) {
        // Update URL to reflect scoring mode
        if (!location.includes('/score')) {
          setLocation(`/prediction/${showId}/score`);
        }
      } else {
        // Update URL to reflect edit mode
        if (location.includes('/score')) {
          setLocation(`/prediction/${showId}`);
        }
      }
    }
  }, [scoringMode, selectedShow, location, setLocation]);
  
  // Clear scoring mode on navigation away from score route
  useEffect(() => {
    // If we're not on a scoring route but scoring mode is true, disable it
    if (location && !location.includes('/score') && scoringMode) {
      setScoringMode(false);
    }
  }, [location, scoringMode]);

  // Helper function to navigate to a show with optional scoring parameter
  const navigateToShow = (showId: string, scoring: boolean = false) => {
    if (scoring) {
      setLocation(`/prediction/${showId}/score`);
    } else {
      setLocation(`/prediction/${showId}`);
    }
  };
  
  // Helper to exit scoring mode
  const exitScoringMode = () => {
    setScoringMode(false);
    if (selectedShow) {
      navigateToShow(selectedShow.showid, false);
    }
  };
  
  // Helper to enter scoring mode
  const enterScoringMode = () => {
    setScoringMode(true);
    if (selectedShow) {
      navigateToShow(selectedShow.showid, true);
    }
  };

  const toggleScoringMode = () => {
    const newScoringMode = !scoringMode;
    setScoringMode(newScoringMode);
    
    // If turning off scoring mode and we have a show selected, immediately redirect
    if (!newScoringMode && selectedShow) {
      navigateToShow(selectedShow.showid, false);
    } else if (newScoringMode && selectedShow) {
      navigateToShow(selectedShow.showid, true);
    }
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
    // Always maintain the fixed number of slots (8 for sets, 3 for encore)
    const maxSlots = set === "encore" ? 3 : 8;
    
    if (song === null) {
      // If removing a song, just clear the song at that position but keep the slot
      setSetlist((prev) => ({
        ...prev,
        [set]: prev[set].map((item) =>
          item.position === position ? { ...item, song: null } : item,
        ),
      }));
    } else {
      // If adding a song, update the existing slot
      setSetlist((prev) => ({
        ...prev,
        [set]: prev[set].map((item) =>
          item.position === position ? { ...item, song } : item,
        ),
      }));
    }
    
    // After update, ensure we have exactly the correct number of slots
    setSetlist((prev) => {
      const currentItems = [...prev[set]];
      
      // If we somehow have too few items, add empty slots
      if (currentItems.length < maxSlots) {
        for (let i = currentItems.length; i < maxSlots; i++) {
          currentItems.push({
            position: i,
            song: null
          });
        }
      }
      
      // If we somehow have too many items, truncate
      if (currentItems.length > maxSlots) {
        currentItems.length = maxSlots;
      }
      
      // Make sure positions are correct
      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        position: index,
      }));
      
      return {
        ...prev,
        [set]: updatedItems,
      };
    });

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

    // Ensure we have exactly the right number of slots
    while (newSetArray.length < maxSize) {
      newSetArray.push({
        position: newSetArray.length,
        song: null
      });
    }
    
    // If somehow we have too many, truncate
    if (newSetArray.length > maxSize) {
      newSetArray.length = maxSize;
    }
    
    // Update positions
    const updatedArray = newSetArray.map((item, index) => ({
      ...item,
      position: index
    }));
    
    // Update state with the new setlist
    setSetlist({
      ...setlist,
      [set]: updatedArray,
    });
  };

  // Function to reorder songs within a set
  const reorderSongs = (
    set: "set1" | "set2" | "encore",
    oldIndex: number,
    newIndex: number,
  ) => {
    // Define maximum size based on the set type
    const maxSize = set === "encore" ? 3 : 8;
    
    // Create a new array for the specific set
    const items = [...setlist[set]];

    // Remove the item from its old position
    const [removedItem] = items.splice(oldIndex, 1);

    // Add the item at its new position
    items.splice(newIndex, 0, removedItem);

    // Ensure we have exactly the right number of slots
    while (items.length < maxSize) {
      items.push({
        position: items.length,
        song: null
      });
    }
    
    // If somehow we have too many, truncate
    if (items.length > maxSize) {
      items.length = maxSize;
    }

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
            set1: Array(8)
              .fill(0)
              .map((_, i) => ({
                position: i,
                song: null as PhishSong | null,
              })),
            set2: Array(8)
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

          // Map the songs into the right format, while ensuring we always have the required number of slots
          // For set1: Always maintain 8 slots
          if (setlistData.set1 && Array.isArray(setlistData.set1)) {
            // Map existing songs
            const set1Songs = setlistData.set1.map(
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
            
            // Fill the rest with empty slots to reach 8 total
            const currentCount = set1Songs.length;
            if (currentCount < 8) {
              for (let i = currentCount; i < 8; i++) {
                set1Songs.push({
                  position: i,
                  song: null
                });
              }
            }
            
            predictionSetlist.set1 = set1Songs;
          }

          // For set2: Always maintain 8 slots
          if (setlistData.set2 && Array.isArray(setlistData.set2)) {
            // Map existing songs
            const set2Songs = setlistData.set2.map(
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
            
            // Fill the rest with empty slots to reach 8 total
            const currentCount = set2Songs.length;
            if (currentCount < 8) {
              for (let i = currentCount; i < 8; i++) {
                set2Songs.push({
                  position: i,
                  song: null
                });
              }
            }
            
            predictionSetlist.set2 = set2Songs;
          }

          // For encore: Always maintain 3 slots
          if (setlistData.encore && Array.isArray(setlistData.encore)) {
            // Map existing songs
            const encoreSongs = setlistData.encore.map(
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
            
            // Fill the rest with empty slots to reach 3 total
            const currentCount = encoreSongs.length;
            if (currentCount < 3) {
              for (let i = currentCount; i < 3; i++) {
                encoreSongs.push({
                  position: i,
                  song: null
                });
              }
            }
            
            predictionSetlist.encore = encoreSongs;
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

  // Compute isInScoringMode based on URL route
  const isInScoringMode = !!scoringRoute;

  return (
    <SetlistContext.Provider
      value={{
        setlist,
        selectedSong,
        selectedShow,
        isInScoringMode,
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
        exitScoringMode,
        enterScoringMode,
        navigateToShow,
        setSetlist,
      }}
    >
      {children}
    </SetlistContext.Provider>
  );
}
