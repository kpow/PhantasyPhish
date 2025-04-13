import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { PhishShow } from '@/types';

interface PredictionItem {
  id: number;
  user_id: number;
  show_id: string;
  setlist: {
    set1: Array<{ id: string; name: string } | null>;
    set2: Array<{ id: string; name: string } | null>;
    encore: Array<{ id: string; name: string } | null>;
  };
  score: number | null;
  created_at: string;
}

interface ShowDetails {
  showdate: string;
  venue: string;
  location: string;
}

export default function MyPredictions() {
  const { user } = useAuth();
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionItem | null>(null);
  const [showDetails, setShowDetails] = useState<ShowDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user predictions
  const { data: predictions, isLoading, error } = useQuery<{ predictions: PredictionItem[] }>({
    queryKey: ['/api/users/' + user?.id + '/predictions'],
    enabled: !!user?.id
  });

  // Fetch show details when a prediction is selected
  const fetchShowDetails = async (showId: string) => {
    try {
      // Check if we already have recent shows data in cache and can extract the data
      const showRes = await fetch(`/api/shows/details/${showId}`);
      if (!showRes.ok) {
        throw new Error('Failed to fetch show details');
      }
      const showData = await showRes.json();
      return showData;
    } catch (error) {
      console.error('Error fetching show details:', error);
      return {
        showdate: 'Unknown Date',
        venue: 'Unknown Venue',
        location: 'Unknown Location'
      };
    }
  };

  const handleViewPrediction = async (prediction: PredictionItem) => {
    setSelectedPrediction(prediction);
    
    try {
      const details = await fetchShowDetails(prediction.show_id);
      setShowDetails(details);
    } catch (error) {
      console.error('Error fetching show details:', error);
      setShowDetails({
        showdate: 'Unknown Date',
        venue: 'Unknown Venue',
        location: 'Unknown Location'
      });
    }
    
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <h1 className="text-2xl font-display text-primary mb-6">my predictions</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#1E1E1E] border-0 shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <h1 className="text-2xl font-display text-primary mb-6">my predictions</h1>
        <Card className="bg-[#1E1E1E] border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-red-400">Error loading predictions. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!predictions || predictions.predictions.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <h1 className="text-2xl font-display text-primary mb-6">my predictions</h1>
        <Card className="bg-[#1E1E1E] border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-gray-300">You haven't made any predictions yet.</p>
            <p className="mt-2 text-gray-400">Visit the upcoming shows section to predict a setlist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Count songs in a prediction
  const countSongs = (prediction: PredictionItem) => {
    const set1Count = prediction.setlist.set1?.filter(song => song !== null).length || 0;
    const set2Count = prediction.setlist.set2?.filter(song => song !== null).length || 0;
    const encoreCount = prediction.setlist.encore?.filter(song => song !== null).length || 0;
    return set1Count + set2Count + encoreCount;
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-display text-primary mb-6">my predictions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predictions.predictions.map((prediction) => (
          <Card key={prediction.id} className="bg-[#1E1E1E] border-0 shadow-lg hover:bg-[#252525] transition-colors">
            <CardHeader>
              <CardTitle className="text-lg text-white">Show ID: {prediction.show_id}</CardTitle>
              <p className="text-gray-400">Predicted on {formatDate(prediction.created_at)}</p>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-gray-300 mb-2">{countSongs(prediction)} songs predicted</p>
              {prediction.score !== null && (
                <p className="mb-2 font-semibold">
                  Score: <span className="text-green-400">{prediction.score}</span>
                </p>
              )}
              <Button 
                className="w-full mt-2 bg-primary hover:bg-blue-600"
                onClick={() => handleViewPrediction(prediction)}
              >
                View Prediction
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prediction Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Setlist Prediction</DialogTitle>
            {showDetails && (
              <DialogDescription className="text-gray-300">
                {showDetails.venue}, {showDetails.location} on {formatDate(showDetails.showdate)}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedPrediction && (
            <div className="my-4 space-y-4">
              <div>
                <h3 className="text-primary font-semibold mb-2">Set 1</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  {selectedPrediction.setlist.set1.some(song => song !== null) ? (
                    <ul>
                      {selectedPrediction.setlist.set1.map((song, i) => song && (
                        <li key={`set1-${i}`} className="mb-1">{song.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 italic">No songs selected</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-orange-500 font-semibold mb-2">Set 2</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  {selectedPrediction.setlist.set2.some(song => song !== null) ? (
                    <ul>
                      {selectedPrediction.setlist.set2.map((song, i) => song && (
                        <li key={`set2-${i}`} className="mb-1">{song.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 italic">No songs selected</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-green-500 font-semibold mb-2">Encore</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  {selectedPrediction.setlist.encore.some(song => song !== null) ? (
                    <ul>
                      {selectedPrediction.setlist.encore.map((song, i) => song && (
                        <li key={`encore-${i}`} className="mb-1">{song.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 italic">No songs selected</p>
                  )}
                </div>
              </div>
              
              {selectedPrediction.score !== null && (
                <div className="mt-4 p-3 bg-[#252525] rounded-md">
                  <p className="font-semibold">
                    Score: <span className="text-green-400 text-lg">{selectedPrediction.score}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              className="bg-primary hover:bg-blue-600"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}