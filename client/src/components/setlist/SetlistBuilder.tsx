import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SetlistSection from './SetlistSection';
import ScoreCard from './ScoreCard';
import { useSetlist } from '@/contexts/SetlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatShowDate } from '@/hooks/usePhishData';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';

export default function SetlistBuilder() {
  const { 
    setlist, 
    selectedSong, 
    selectedShow, 
    scoringMode,
    scoringData,
    setSetlistSpot, 
    reorderSongs, 
    clearSetlist, 
    resetSetlistAndShow, 
    loadPredictionForShow,
    toggleScoringMode,
    setScoringData
  } = useSetlist();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/prediction/:showId');
  const [scoringMatch, scoringParams] = useRoute('/prediction/:showId/score');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>('Build a Setlist');
  
  // Effect to update the page title when show or scoring mode changes
  useEffect(() => {
    if (selectedShow) {
      let title = `${formatShowDate(selectedShow.showdate)} - ${selectedShow.venue}`;
      if (scoringMode) {
        title += ' (Scoring)';
      } else {
        title += ' (Editing)';
      }
      setPageTitle(title);
    } else {
      setPageTitle('Build a Setlist');
    }
  }, [selectedShow, scoringMode]);
  
  // Effect to load prediction data from URL params on component mount
  useEffect(() => {
    const fetchPredictionFromURL = async () => {
      // Check if we're on a prediction URL with a showId param
      if (match && params.showId) {
        // Load the prediction for this show
        const success = await loadPredictionForShow(params.showId);
        if (!success) {
          toast({
            title: "Prediction Not Found",
            description: "Could not find a prediction for this show ID.",
            variant: "destructive"
          });
        }
      }
      // Check if we're on a scoring URL with a showId param
      else if (scoringMatch && scoringParams.showId) {
        // Load the prediction for scoring
        const success = await loadPredictionForShow(scoringParams.showId);
        if (success) {
          // Enable scoring mode
          if (!scoringMode) {
            toggleScoringMode();
          }
        } else {
          toast({
            title: "Prediction Not Found",
            description: "Could not find a prediction for this show ID to score.",
            variant: "destructive"
          });
        }
      }
    };
    
    fetchPredictionFromURL();
  }, [match, params, scoringMatch, scoringParams, loadPredictionForShow, toggleScoringMode, scoringMode]);

  // Function to test the scoring functionality
  const handleTestScoring = async () => {
    if (!selectedShow || isTesting) return;
    
    setIsTesting(true);
    try {
      const hasAnySongs = setlist.set1.some(item => item.song) || 
                      setlist.set2.some(item => item.song) || 
                      setlist.encore.some(item => item.song);

      if (!hasAnySongs) {
        toast({
          title: "Can't score empty prediction",
          description: "Please select at least one song for your prediction.",
          variant: "destructive"
        });
        return;
      }

      // First, save the prediction if it's not already saved
      const predictionData = {
        user_id: user?.id, 
        show_id: selectedShow.showid, 
        setlist: {
          set1: setlist.set1.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
          set2: setlist.set2.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
          encore: setlist.encore.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        }
      };

      const saveResponse = await fetch('/api/predictions', {
        method: 'POST',
        body: JSON.stringify(predictionData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save prediction for testing');
      }

      const saveData = await saveResponse.json();
      const predictionId = saveData.prediction.id;

      // For testing purposes, use actual show setlists from 2024
      // These are actual Phish setlists from recent shows
      const testSetlist = {
        set1: [
          { name: "Turtle in the Clouds", position: 0 },
          { name: "Sigma Oasis", position: 1 },
          { name: "46 Days", position: 2 },
          { name: "Army of One", position: 3 },
          { name: "Tube", position: 4 },
          { name: "Bathtub Gin", position: 5 },
          { name: "Split Open and Melt", position: 6 },
          { name: "The Howling", position: 7 },
          { name: "Walls of the Cave", position: 8 }
        ],
        set2: [
          { name: "Set Your Soul Free", position: 0 },
          { name: "No Men In No Man's Land", position: 1 },
          { name: "Ruby Waves", position: 2 },
          { name: "Twist", position: 3 },
          { name: "Plasma", position: 4 },
          { name: "Slave to the Traffic Light", position: 5 }
        ],
        encore: [
          { name: "A Life Beyond The Dream", position: 0 },
          { name: "Character Zero", position: 1 }
        ]
      };

      // Convert prediction data for scoring
      // Ensure the prediction format matches what the scoring engine expects
      const formattedPrediction = {
        set1: setlist.set1.map(item => ({
          position: item.position,
          song: item.song ? {
            id: item.song.id,
            name: item.song.name,
            slug: item.song.slug || '',
            times_played: item.song.times_played || 0
          } : null
        })),
        set2: setlist.set2.map(item => ({
          position: item.position,
          song: item.song ? {
            id: item.song.id,
            name: item.song.name,
            slug: item.song.slug || '',
            times_played: item.song.times_played || 0
          } : null
        })),
        encore: setlist.encore.map(item => ({
          position: item.position,
          song: item.song ? {
            id: item.song.id,
            name: item.song.name,
            slug: item.song.slug || '',
            times_played: item.song.times_played || 0
          } : null
        }))
      };

      // Use the test scoring endpoint
      const testResponse = await fetch('/api/test/score', {
        method: 'POST',
        body: JSON.stringify({
          prediction: formattedPrediction,
          actualSetlist: testSetlist
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error('Failed to test scoring');
      }

      const scoreData = await testResponse.json();
      
      // Set the scoring data in the context
      const showDetails = {
        date: selectedShow.showdate,
        venue: selectedShow.venue,
        location: selectedShow.location
      };
      
      // Create a new scoring data object and update the context
      const newScoringData = {
        breakdown: scoreData.breakdown,
        actualSetlist: testSetlist,
        showDetails: showDetails,
        isLoading: false,
        error: null
      };
      
      // Update scoring data in context
      setScoringData(newScoringData);
      
      // Enable scoring mode to display the score card
      toggleScoringMode();
      
      // Update URL to reflect we're in scoring mode
      if (selectedShow && location !== `/prediction/${selectedShow.showid}/score`) {
        setLocation(`/prediction/${selectedShow.showid}/score`);
      }
      
      toast({
        title: "Test Scoring Complete",
        description: `Your setlist prediction scored ${scoreData.score} points!`,
        duration: 5000
      });
    } catch (error) {
      console.error('Error testing scoring:', error);
      toast({
        title: "Scoring Test Failed",
        description: "There was an error testing the scoring system. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmitPrediction = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    // Check if we have a selected show
    if (!selectedShow) {
      toast({
        title: "No show selected",
        description: "Please select a show from the upcoming shows section.",
        variant: "destructive"
      });
      return;
    }

    const hasAnySongs = setlist.set1.some(item => item.song) || 
                        setlist.set2.some(item => item.song) || 
                        setlist.encore.some(item => item.song);

    if (!hasAnySongs) {
      toast({
        title: "Can't submit empty prediction",
        description: "Please select at least one song for your prediction.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const predictionData = {
        user_id: user?.id, 
        show_id: selectedShow.showid, 
        setlist: {
          set1: setlist.set1.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
          set2: setlist.set2.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
          encore: setlist.encore.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        }
      };

      const response = await fetch('/api/predictions', {
        method: 'POST',
        body: JSON.stringify(predictionData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to save prediction to server');
      }

      const responseData = await response.json();
      
      // Dispatch a custom event to notify other components a prediction was saved
      const event = new CustomEvent('predictionSaved', { 
        detail: { 
          showId: selectedShow.showid 
        } 
      });
      window.dispatchEvent(event);
      
      // Different message based on whether it's an update or new prediction
      if (responseData.updated) {
        toast({
          title: "Prediction Updated!",
          description: `Your setlist prediction for ${selectedShow.venue} on ${formatShowDate(selectedShow.showdate)} has been updated.`
        });
      } else {
        toast({
          title: "Prediction Saved!",
          description: `Your setlist prediction has been saved for ${selectedShow.venue} on ${formatShowDate(selectedShow.showdate)}.`
        });
      }

      // Don't reset - just leave the current setlist displayed
      // This will let the user continue working with their saved setlist
      
      // Update the URL to reflect the prediction being edited
      // Only update if we're not already on that URL
      if (location !== `/prediction/${selectedShow.showid}`) {
        setLocation(`/prediction/${selectedShow.showid}`);
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast({
        title: "Failed to save prediction",
        description: "There was an error saving your prediction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg h-full">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl text-white">build-a-setlist</h2>
          {selectedShow && (
            <div className="text-sm text-gray-300">
              <span className="bg-gray-800 py-1 px-2 rounded-md">
                {formatShowDate(selectedShow.showdate)}
              </span>
            </div>
          )}
        </div>

        {selectedShow ? (
          <div className="mb-4 p-3 bg-[#252525] rounded-md text-gray-300">
            <p className="font-semibold">{selectedShow.venue}</p>
            <p className="text-sm">{selectedShow.location}</p>
            <div className="mt-2 text-xs text-gray-400 italic">
              <p>Tip: Click on any song in your setlist to remove it</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-md text-red-200">
            <p className="font-semibold">No show selected</p>
            <p className="text-sm">Please select an upcoming show to build a setlist</p>
          </div>
        )}

<div className={`relative ${!selectedShow ? "opacity-50 pointer-events-none" : ""}`}>
  <SetlistSection 
    title="Set 1"
    setType="set1"
    setItems={setlist.set1}
    titleColor="text-primary"
    borderColor="border-primary"
    height="h-[230px]"
    onSetSong={setSetlistSpot}
    onReorderSongs={reorderSongs}
    selectedSong={selectedSong}
  />

  <SetlistSection 
    title="Set 2"
    setType="set2"
    setItems={setlist.set2}
    titleColor="text-orange-500"
    borderColor="border-orange-500"
    height="h-[230px]"
    onSetSong={setSetlistSpot}
    onReorderSongs={reorderSongs}
    selectedSong={selectedSong}
  />

  <SetlistSection 
    title="Encore"
    setType="encore"
    setItems={setlist.encore}
    titleColor="text-green-500"
    borderColor="border-green-500"
    height="h-[140px]"
    onSetSong={setSetlistSpot}
    onReorderSongs={reorderSongs}
    selectedSong={selectedSong}
  />
  
  {/* We no longer need the scorecard overlay - it's shown in the third column */}
</div>

        <div className="mt-6 flex gap-2">
          {scoringMode ? (
            <>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 font-medium py-3 px-4 rounded-lg transition-colors font-display text-lg"
                onClick={() => {
                  toggleScoringMode();
                  
                  // Update URL when going back to edit mode
                  if (selectedShow && location !== `/prediction/${selectedShow.showid}`) {
                    setLocation(`/prediction/${selectedShow.showid}`);
                  }
                }}
              >
                Back to Setlist
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col w-full gap-2">
                <Button 
                  className="w-full bg-primary hover:bg-blue-600 font-medium py-3 px-4 rounded-lg transition-colors font-display text-lg"
                  onClick={handleSubmitPrediction}
                  disabled={!selectedShow || isSubmitting || isTesting}
                >
                  {isSubmitting 
                    ? "Saving..." 
                    : selectedShow 
                      ? "submit setlist" 
                      : "select a show first"
                  }
                </Button>
                <Button 
                  variant="secondary"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors font-display"
                  onClick={handleTestScoring}
                  disabled={!selectedShow || isSubmitting || isTesting}
                >
                  {isTesting ? "Testing..." : "Test Score"}
                </Button>
              </div>
              <Button 
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-gray-800"
                onClick={resetSetlistAndShow}
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}