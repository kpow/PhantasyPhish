import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatShowDate } from '@/hooks/usePhishData';

interface PredictionData {
  id: number;
  show_id: string;
  showdate: string;
  setlist: {
    set1: Array<{ id: string; name: string } | null>;
    set2: Array<{ id: string; name: string } | null>;
    encore: Array<{ id: string; name: string } | null>;
  };
}

export default function ShowOverlay() {
  const { user, isAuthenticated } = useAuth();
  const { config } = useConfig();
  const [userPrediction, setUserPrediction] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run if the overlay is enabled and user is authenticated
    if (!config.siteOverlayEnabled || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchClosestPrediction = async () => {
      try {
        setIsLoading(true);
        
        // Get user predictions
        const response = await fetch(`/api/users/${user?.id}/predictions`);
        if (!response.ok) throw new Error('Failed to fetch predictions');
        
        const data = await response.json();
        
        if (!data.predictions || data.predictions.length === 0) {
          setUserPrediction(null);
          return;
        }
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        
        // First try to find a prediction for today's show
        const todayPrediction = await findPredictionForDate(data.predictions, formattedToday);
        
        if (todayPrediction) {
          setUserPrediction(todayPrediction);
          return;
        }
        
        // Next try to find the closest future prediction
        const futurePredictions = await getFuturePredictions(data.predictions);
        
        if (futurePredictions.length > 0) {
          // Sort by date (ascending) to get the closest upcoming show
          futurePredictions.sort((a, b) => 
            new Date(a.showdate).getTime() - new Date(b.showdate).getTime()
          );
          
          setUserPrediction(futurePredictions[0]);
          return;
        }
        
        // If no future predictions, use the most recent past prediction
        const pastPredictions = await getPastPredictions(data.predictions);
        
        if (pastPredictions.length > 0) {
          // Sort by date (descending) to get the most recent show
          pastPredictions.sort((a, b) => 
            new Date(b.showdate).getTime() - new Date(a.showdate).getTime()
          );
          
          setUserPrediction(pastPredictions[0]);
          return;
        }
        
        // No predictions found
        setUserPrediction(null);
      } catch (error) {
        console.error('Error fetching closest prediction:', error);
        setUserPrediction(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClosestPrediction();
  }, [config.siteOverlayEnabled, isAuthenticated, user]);
  
  // Get show date for a prediction
  const getShowDate = async (showId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/shows/${showId}`);
      if (!response.ok) return null;
      
      const showData = await response.json();
      return showData.showdate;
    } catch (error) {
      console.error(`Error getting show date for ${showId}:`, error);
      return null;
    }
  };

  // Find a prediction for a specific date
  const findPredictionForDate = async (predictions: any[], date: string) => {
    for (const prediction of predictions) {
      try {
        const showdate = await getShowDate(prediction.show_id);
        if (!showdate) continue;
        
        if (showdate === date) {
          return {
            ...prediction,
            showdate
          };
        }
      } catch (error) {
        console.error(`Error checking show date for prediction ${prediction.id}:`, error);
      }
    }
    
    return null;
  };
  
  // Get future predictions
  const getFuturePredictions = async (predictions: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futurePredictions = [];
    
    for (const prediction of predictions) {
      try {
        const showdate = await getShowDate(prediction.show_id);
        if (!showdate) continue;
        
        const showDate = new Date(showdate);
        showDate.setHours(0, 0, 0, 0);
        
        if (showDate > today) {
          futurePredictions.push({
            ...prediction,
            showdate
          });
        }
      } catch (error) {
        console.error(`Error checking show date for prediction ${prediction.id}:`, error);
      }
    }
    
    return futurePredictions;
  };
  
  // Get past predictions
  const getPastPredictions = async (predictions: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastPredictions = [];
    
    for (const prediction of predictions) {
      try {
        const showdate = await getShowDate(prediction.show_id);
        if (!showdate) continue;
        
        const showDate = new Date(showdate);
        showDate.setHours(0, 0, 0, 0);
        
        if (showDate < today) {
          pastPredictions.push({
            ...prediction,
            showdate
          });
        }
      } catch (error) {
        console.error(`Error checking show date for prediction ${prediction.id}:`, error);
      }
    }
    
    return pastPredictions;
  };

  // If overlay is disabled, don't render anything
  if (!config.siteOverlayEnabled) {
    return null;
  }

  // Display loading overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 pt-16 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="container max-w-md">
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader>
              <CardTitle className="text-center">Loading...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Display overlay with prediction if authenticated
  return (
    <div className="fixed inset-0 pt-16 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="container max-w-3xl">
        <Card className="bg-[#1a1a1a] border-[#333] text-white">
          <CardHeader>
            <CardTitle className="text-center text-primary">
              Phish is playing live right now!
            </CardTitle>
            <p className="text-center text-gray-400 mt-2">
              The site is currently disabled during the show. Check back later to score your prediction!
            </p>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              userPrediction ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg text-primary-foreground">
                      Your setlist prediction for {formatShowDate(userPrediction.showdate)}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-primary font-semibold mb-2 font-display">set 1</h4>
                      <div className="bg-[#252525] p-3 rounded-md">
                        {userPrediction.setlist.set1.some(song => song !== null) ? (
                          <ul className="space-y-1">
                            {userPrediction.setlist.set1.map((song, i) => song && (
                              <li key={`set1-${i}`} className="text-gray-300">
                                {song.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 italic">No songs selected</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-orange-500 font-semibold mb-2 font-display">set 2</h4>
                      <div className="bg-[#252525] p-3 rounded-md">
                        {userPrediction.setlist.set2.some(song => song !== null) ? (
                          <ul className="space-y-1">
                            {userPrediction.setlist.set2.map((song, i) => song && (
                              <li key={`set2-${i}`} className="text-gray-300">
                                {song.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 italic">No songs selected</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-green-500 font-semibold mb-2 font-display">encore</h4>
                      <div className="bg-[#252525] p-3 rounded-md">
                        {userPrediction.setlist.encore.some(song => song !== null) ? (
                          <ul className="space-y-1">
                            {userPrediction.setlist.encore.map((song, i) => song && (
                              <li key={`encore-${i}`} className="text-gray-300">
                                {song.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 italic">No songs selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">
                    You don't have any setlist predictions. Check back after the show!
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400">
                  Log in to see your setlist prediction displayed here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}