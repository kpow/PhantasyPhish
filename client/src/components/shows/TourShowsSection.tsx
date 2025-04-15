import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Music, Check, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSetlist } from '@/contexts/SetlistContext';
import { useToast } from '@/hooks/use-toast';
import { formatShowDate } from '@/hooks/usePhishData';

interface Tour {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

interface Show {
  id: number;
  show_id: string;
  date: string;
  venue: string;
  city: string;
  state: string | null;
  country: string;
  tour_id: number | null;
  is_scored: boolean;
}

export default function TourShowsSection({ className }: { className?: string }) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setSelectedShow, loadPredictionForShow, clearSetlist } = useSetlist();
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [userPredictions, setUserPredictions] = useState<Record<string, boolean>>({});
  
  // Fetch all available tours
  const { data: tourData, isLoading: isLoadingTours } = useQuery<{ tours: Tour[] }>({
    queryKey: ['/api/tours'],
  });
  
  // Fetch shows for selected tour
  const { data: showData, isLoading: isLoadingShows } = useQuery<{ shows: Show[] }>({
    queryKey: [`/api/tours/${selectedTourId}/shows`],
    enabled: !!selectedTourId
  });
  
  // After tour data is loaded, set the default selected tour to the first available
  useEffect(() => {
    if (tourData?.tours && tourData.tours.length > 0 && !selectedTourId) {
      // Default to the first tour (likely to be the current/upcoming tour)
      setSelectedTourId(tourData.tours[0].id);
    }
  }, [tourData, selectedTourId]);
  
  // Check which shows the user has predictions for
  useEffect(() => {
    const checkUserPredictions = async () => {
      if (isAuthenticated && showData?.shows) {
        const predictions: Record<string, boolean> = {};
        
        for (const show of showData.shows) {
          try {
            const response = await fetch(`/api/users/current/predictions/${show.show_id}`);
            if (response.ok) {
              const data = await response.json();
              predictions[show.show_id] = !!data.prediction;
            }
          } catch (error) {
            console.error(`Error checking prediction for show ${show.show_id}:`, error);
          }
        }
        
        setUserPredictions(predictions);
      }
    };
    
    checkUserPredictions();
  }, [isAuthenticated, showData, user?.id]);
  
  // Handle selecting a show for prediction
  const handleSelectShow = async (show: Show) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to make setlist predictions.",
        variant: "destructive"
      });
      return;
    }
    
    // Format the show for the setlist context
    const formattedShow = {
      showid: show.show_id,
      showdate: show.date,
      venue: show.venue,
      location: `${show.city}, ${show.state || show.country}`,
      country: show.country
    };
    
    setSelectedShow(formattedShow);
    
    // Load existing prediction or clear the form
    const hasPrediction = userPredictions[show.show_id];
    if (hasPrediction) {
      await loadPredictionForShow(show.show_id);
    } else {
      clearSetlist();
    }
    
    // Navigate to prediction page
    setLocation(`/prediction/${show.show_id}`);
  };
  
  // Handle viewing show results/leaderboard
  const handleViewResults = (show: Show) => {
    setLocation(`/shows/${show.show_id}/results`);
  };
  
  // Render loading state
  if (isLoadingTours) {
    return (
      <Card className={`${className || ''} bg-[#1A1A1A] border-0 shadow-lg`}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (!tourData?.tours || tourData.tours.length === 0) {
    return (
      <Card className={`${className || ''} bg-[#1A1A1A] border-0 shadow-lg`}>
        <CardHeader>
          <CardTitle className="text-white text-lg">Tour Shows</CardTitle>
          <CardDescription>No tours available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            No tour information found in the database.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`${className || ''} bg-[#1A1A1A] border-0 shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Tour Shows</CardTitle>
        <CardDescription>
          <Tabs 
            defaultValue={selectedTourId?.toString() || tourData.tours[0].id.toString()} 
            onValueChange={(value) => setSelectedTourId(parseInt(value))}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto">
              {tourData.tours.map(tour => (
                <TabsTrigger 
                  key={tour.id} 
                  value={tour.id.toString()}
                  className="text-xs py-1 px-2 h-auto"
                >
                  {tour.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Shows for each tour in tabs */}
        {tourData.tours.map(tour => (
          <TabsContent key={tour.id} value={tour.id.toString()} className="mt-0 pt-4">
            <div className="mb-2 text-xs text-gray-400 flex items-center">
              <CalendarDays className="h-3 w-3 mr-1" />
              {formatShowDate(tour.start_date)} - {formatShowDate(tour.end_date)}
            </div>
            
            {isLoadingShows ? (
              <div className="space-y-4 mt-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : !showData?.shows || showData.shows.length === 0 ? (
              <div className="p-4 mt-2 bg-[#252525] rounded-lg text-center">
                <p className="text-gray-400">No shows assigned to this tour yet.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {showData.shows.map(show => {
                  const isPast = new Date(show.date) < new Date();
                  const hasPrediction = !!userPredictions[show.show_id];
                  
                  return (
                    <div 
                      key={show.id} 
                      className="bg-[#252525] p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">{formatShowDate(show.date)}</p>
                          <p className="text-gray-400 text-sm flex items-center">
                            <MapPin className="h-3 w-3 mr-1" /> 
                            {show.venue}, {show.city}, {show.state || show.country}
                          </p>
                        </div>
                        <div className="flex">
                          {hasPrediction && (
                            <Badge className="bg-blue-600 mr-2">
                              <Check className="h-3 w-3 mr-1" /> Predicted
                            </Badge>
                          )}
                          {show.is_scored && (
                            <Badge className="bg-green-600">
                              Scored
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {isPast ? (
                          <>
                            {show.is_scored ? (
                              <Button 
                                className="flex-1 bg-green-700 hover:bg-green-800"
                                onClick={() => handleViewResults(show)}
                                variant="secondary"
                                size="sm"
                              >
                                <BarChart3 className="h-4 w-4 mr-1" /> View Results
                              </Button>
                            ) : (
                              <Button
                                className="flex-1"
                                variant="secondary"
                                size="sm"
                                disabled
                              >
                                Results Pending
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button 
                            className="flex-1 bg-primary hover:bg-purple-600"
                            onClick={() => handleSelectShow(show)}
                            size="sm"
                          >
                            <Music className="h-4 w-4 mr-1" /> 
                            {hasPrediction ? "Edit Prediction" : "Make Prediction"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </CardContent>
    </Card>
  );
}