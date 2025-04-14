// Define the types here to avoid import issues
export interface SetlistItem {
  position: number;
  song: {
    id: string | number;
    name: string;
    slug?: string;
    times_played?: number;
  } | null;
}

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

/**
 * Score a prediction against an actual setlist
 */
export function scorePrediction(
  predictionSetlist: {
    set1: SetlistItem[];
    set2: SetlistItem[];
    encore: SetlistItem[];
  },
  actualSetlist: ProcessedSetlist
): ScoringBreakdown {
  // Initialize scoring breakdown
  const breakdown: ScoringBreakdown = {
    totalScore: 0,
    songInShow: { count: 0, points: 0 },
    songInSet: { count: 0, points: 0 },
    correctSong: { count: 0, points: 0 },
    correctSpecial: { count: 0, points: 0 },
    encoreInSet: { count: 0, points: 0 },
    details: []
  };

  // Gather all songs from actual setlist for quick lookups
  const allActualSongs = [
    ...actualSetlist.set1.map(s => ({ ...s, set: 'set1' })),
    ...actualSetlist.set2.map(s => ({ ...s, set: 'set2' })),
    ...actualSetlist.encore.map(s => ({ ...s, set: 'encore' }))
  ];

  // Process each predicted set
  ['set1', 'set2', 'encore'].forEach((setKey) => {
    const predictedSet = predictionSetlist[setKey as keyof typeof predictionSetlist];
    const actualSet = actualSetlist[setKey as keyof typeof actualSetlist];

    // Check for null songs in the set and filter them out
    const validPredictions = predictedSet.filter(item => item && item.song !== null);
    
    // Score each valid prediction
    validPredictions.forEach(prediction => {
      if (!prediction || !prediction.song) return; // Skip null predictions
      
      const songName = prediction.song.name;
      const predictedPosition = prediction.position;
      const isOpener = predictedPosition === 0;
      const isCloser = predictedPosition === predictedSet.length - 1;
      
      // Find this song in the actual setlist (if it exists)
      const inActualFullShow = allActualSongs.find(s => 
        s.name.toLowerCase() === songName.toLowerCase()
      );
      
      // Find in the specific set
      const inActualSet = actualSet.find(s => 
        s.name.toLowerCase() === songName.toLowerCase()
      );
      
      const inActualSetExactPosition = actualSet.find(s => 
        s.name.toLowerCase() === songName.toLowerCase() && 
        s.position === predictedPosition
      );

      // Special case for openers and closers
      const isActualOpener = inActualSet && inActualSet.position === 0;
      const isActualCloser = inActualSet && inActualSet.position === actualSet.length - 1;
      
      // Score based on the criteria
      let points = 0;
      let reason = "";
      
      if (inActualSetExactPosition) {
        // Check if it's an opener, closer, or encore song at exact position
        if ((isOpener && isActualOpener) || 
            (isCloser && isActualCloser) || 
            (setKey === 'encore' && predictedPosition === inActualSetExactPosition.position)) {
          points = 15; // Correct position for special song
          breakdown.correctSpecial.count++;
          breakdown.correctSpecial.points += points;
          reason = `${setKey === 'encore' ? 'Encore' : (isOpener ? 'Opener' : 'Closer')} in correct position`;
        } else {
          points = 10; // Correct song in correct position
          breakdown.correctSong.count++;
          breakdown.correctSong.points += points;
          reason = "Correct song, correct position";
        }
      } else if (inActualSet) {
        // Song in correct set but wrong position
        if (setKey === 'encore') {
          points = 10; // Encore song but wrong position
          breakdown.encoreInSet.count++;
          breakdown.encoreInSet.points += points;
          reason = "Encore song in wrong position";
        } else {
          points = 6; // Song in correct set but wrong position
          breakdown.songInSet.count++;
          breakdown.songInSet.points += points;
          reason = "Song in correct set, wrong position";
        }
      } else if (inActualFullShow) {
        // Song in show but wrong set
        points = 3;
        breakdown.songInShow.count++;
        breakdown.songInShow.points += points;
        reason = "Song in show, wrong set";
      } else {
        // Song not played
        points = 0;
        reason = "Song not played";
      }
      
      // Add to details
      breakdown.details.push({
        songName,
        predictedSet: setKey,
        predictedPosition,
        actualSet: inActualFullShow?.set,
        actualPosition: inActualFullShow?.position,
        points,
        reason
      });
      
      // Add to total score
      breakdown.totalScore += points;
    });
  });

  return breakdown;
}

/**
 * Converts raw setlist data from the API to a standardized ProcessedSetlist format
 */
export function processRawSetlist(setlistData: any[]): ProcessedSetlist {
  // Group songs by set
  const setGroups = setlistData.reduce((acc: any, song: any) => {
    if (!acc[song.set]) {
      acc[song.set] = [];
    }
    acc[song.set].push({
      name: song.song,
      position: parseInt(song.position, 10) - 1, // Convert to 0-based index
    });
    return acc;
  }, {});
  
  // Create a properly structured setlist
  const processedSetlist: ProcessedSetlist = {
    set1: [],
    set2: [],
    encore: []
  };
  
  // Sort songs by position within each set
  if (setGroups["1"]) {
    processedSetlist.set1 = setGroups["1"].sort((a: any, b: any) => a.position - b.position);
  }
  
  if (setGroups["2"]) {
    processedSetlist.set2 = setGroups["2"].sort((a: any, b: any) => a.position - b.position);
  }
  
  if (setGroups["e"]) {
    processedSetlist.encore = setGroups["e"].sort((a: any, b: any) => a.position - b.position);
  }
  
  return processedSetlist;
}