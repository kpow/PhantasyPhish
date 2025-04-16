import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useConfig } from "@/contexts/ConfigContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShowDate } from "@/hooks/usePhishData";
import { useLocation } from "wouter";

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
  const [location] = useLocation();
  const [userPrediction, setUserPrediction] = useState<PredictionData | null>(
    null,
  );
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
        console.log("Fetching predictions for user:", user?.id);
        const response = await fetch(`/api/users/${user?.id}/predictions`);
        if (!response.ok) throw new Error("Failed to fetch predictions");

        const data = await response.json();
        console.log("User predictions:", data.predictions);

        if (!data.predictions || data.predictions.length === 0) {
          console.log("No predictions found for user");
          setUserPrediction(null);
          setIsLoading(false);
          return;
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const formattedToday = today.toISOString().split("T")[0];
        console.log("Today's date:", formattedToday);

        // First try to find a prediction for today's show
        console.log("Looking for prediction for today's show");
        const todayPrediction = await findPredictionForDate(
          data.predictions,
          formattedToday,
        );

        if (todayPrediction) {
          console.log("Found prediction for today:", todayPrediction);
          setUserPrediction(todayPrediction);
          setIsLoading(false);
          return;
        }

        // Next try to find the closest future prediction
        console.log("Looking for future predictions");
        const futurePredictions = await getFuturePredictions(data.predictions);
        console.log("Future predictions:", futurePredictions);

        if (futurePredictions.length > 0) {
          // Sort by date (ascending) to get the closest upcoming show
          futurePredictions.sort(
            (a, b) =>
              new Date(a.showdate).getTime() - new Date(b.showdate).getTime(),
          );

          console.log(
            "Selected closest future prediction:",
            futurePredictions[0],
          );
          setUserPrediction(futurePredictions[0]);
          setIsLoading(false);
          return;
        }

        // If no future predictions, use the most recent past prediction
        console.log("Looking for past predictions");
        const pastPredictions = await getPastPredictions(data.predictions);
        console.log("Past predictions:", pastPredictions);

        if (pastPredictions.length > 0) {
          // Sort by date (descending) to get the most recent show
          pastPredictions.sort(
            (a, b) =>
              new Date(b.showdate).getTime() - new Date(a.showdate).getTime(),
          );

          console.log(
            "Selected most recent past prediction:",
            pastPredictions[0],
          );
          setUserPrediction(pastPredictions[0]);
          setIsLoading(false);
          return;
        }

        // No predictions found
        console.log("No suitable predictions found");
        setUserPrediction(null);
      } catch (error) {
        console.error("Error fetching closest prediction:", error);
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
      console.log(`Fetching show data for show ID: ${showId}`);
      const response = await fetch(`/api/shows/${showId}`);
      if (!response.ok) {
        console.error(
          `Error fetching show data: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const showData = await response.json();
      console.log("Show data received:", showData);

      // Handle different API response structures
      const date = showData.date || showData.showdate;

      if (!date) {
        console.error("No date found in show data", showData);
        return null;
      }

      return date;
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
            showdate,
          };
        }
      } catch (error) {
        console.error(
          `Error checking show date for prediction ${prediction.id}:`,
          error,
        );
      }
    }

    return null;
  };

  // Get future predictions
  const getFuturePredictions = async (predictions: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("Today's date for comparison:", today);

    const futurePredictions = [];

    for (const prediction of predictions) {
      try {
        const showdate = await getShowDate(prediction.show_id);
        if (!showdate) {
          console.log(`No showdate found for prediction ${prediction.id}`);
          continue;
        }

        console.log(`Show date for prediction ${prediction.id}: ${showdate}`);
        const showDate = new Date(showdate);
        showDate.setHours(0, 0, 0, 0);
        console.log(
          `Comparing dates: ${showDate} > ${today} = ${showDate > today}`,
        );

        if (showDate > today) {
          futurePredictions.push({
            ...prediction,
            showdate,
          });
        }
      } catch (error) {
        console.error(
          `Error checking show date for prediction ${prediction.id}:`,
          error,
        );
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

        console.log(`Show date for prediction ${prediction.id}: ${showdate}`);
        const showDate = new Date(showdate);
        showDate.setHours(0, 0, 0, 0);
        console.log(
          `Comparing dates: ${showDate} < ${today} = ${showDate < today}`,
        );

        if (showDate < today) {
          pastPredictions.push({
            ...prediction,
            showdate,
          });
        }
      } catch (error) {
        console.error(
          `Error checking show date for prediction ${prediction.id}:`,
          error,
        );
      }
    }

    return pastPredictions;
  };

  // Check what page we're on
  const isAdminPage = location.startsWith("/admin");
  const isAuthPage = 
    location === "/login" || 
    location === "/register" || 
    location === "/forgot-password" || 
    location === "/reset-password" || 
    location === "/verify-email" || 
    location === "/resend-verification" ||
    location === "/profile" ||
    location === "/my-predictions" ||
    location.startsWith("/reset-password/") || 
    location.startsWith("/verify-email/");
  
  // We only want to show the overlay on the main setlist builder pages
  const shouldShowOverlay = !isAdminPage && !isAuthPage;
  
  // Add a side effect to disable scrolling when the overlay is active
  useEffect(() => {
    // Only apply if overlay is enabled and we should show the overlay
    if (config.siteOverlayEnabled && shouldShowOverlay) {
      // Save the current overflow value
      const originalOverflow = document.body.style.overflow;
      
      // Disable scrolling on the body
      document.body.style.overflow = "hidden";
      
      // Cleanup function to restore scrolling when component unmounts
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [config.siteOverlayEnabled, shouldShowOverlay]);
  
  // If overlay is disabled or we shouldn't show the overlay, don't render anything
  if (!config.siteOverlayEnabled || !shouldShowOverlay) {
    return null;
  }

  // Display loading overlay
  if (isLoading) {
    return (
      <div className="fixed top-40 sm:top-24 left-0 right-0 bottom-0 bg-black/90 backdrop-blur-sm z-40 flex items-center justify-center">
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
    <div className="fixed top-40 sm:top-24 left-0 right-0 bottom-0 bg-black/90 backdrop-blur-sm z-40 flex pt-[100px] justify-center overflow-auto">
      <div className="container max-w-3xl">
        <Card className="bg-[#1a1a1a] border-[#333] text-white">
          <CardHeader>
            <CardTitle className="text-center text-primary font-display text-3xl">
              Phish is playing live right now!
            </CardTitle>
            <p className="text-center text-gray-400 mt-2">
              the site is disabled during the show. Check back later to score
              your setlist picks!
            </p>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              userPrediction ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg text-primary-foreground font-bold">
                      Your setlist prediction for{" "}
                      {formatShowDate(userPrediction.showdate)}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-primary font-semibold mb-2 font-display">
                        set 1
                      </h4>
                      <div className="bg-[#252525] p-3 rounded-md">
                        {userPrediction.setlist.set1.some(
                          (song) => song !== null,
                        ) ? (
                          <ul className="space-y-1">
                            {userPrediction.setlist.set1.map(
                              (song, i) =>
                                song && (
                                  <li
                                    key={`set1-${i}`}
                                    className="text-gray-300"
                                  >
                                    {song.name}
                                  </li>
                                ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-gray-400 italic">
                            No songs selected
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-orange-500 font-semibold mb-2 font-display">
                        set 2
                      </h4>
                      <div className="bg-[#252525] p-3 rounded-md">
                        {userPrediction.setlist.set2.some(
                          (song) => song !== null,
                        ) ? (
                          <ul className="space-y-1">
                            {userPrediction.setlist.set2.map(
                              (song, i) =>
                                song && (
                                  <li
                                    key={`set2-${i}`}
                                    className="text-gray-300"
                                  >
                                    {song.name}
                                  </li>
                                ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-gray-400 italic">
                            No songs selected
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-green-500 font-semibold mb-2 font-display">
                        encore
                      </h4>
                      <div className="bg-[#252525] p-3 rounded-md">
                        {userPrediction.setlist.encore.some(
                          (song) => song !== null,
                        ) ? (
                          <ul className="space-y-1">
                            {userPrediction.setlist.encore.map(
                              (song, i) =>
                                song && (
                                  <li
                                    key={`encore-${i}`}
                                    className="text-gray-300"
                                  >
                                    {song.name}
                                  </li>
                                ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-gray-400 italic">
                            No songs selected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">
                    You don't have any setlist predictions. Check back after the
                    show!
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
