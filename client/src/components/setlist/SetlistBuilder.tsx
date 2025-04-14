import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SetlistSection from './SetlistSection';
import ScoreCard from './ScoreCard';
import { useSetlist } from '@/contexts/SetlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatShowDate } from '@/hooks/usePhishData';
import { useQuery } from '@tanstack/react-query';

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
    toggleScoringMode
  } = useSetlist();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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

      // Now test scoring with the test endpoint
      // In a real scenario, we would fetch the actual setlist from the API
      // For testing purposes, we'll use a sample setlist
      const testSetlist = {
        set1: [
          { name: "Tweezer", position: 0 },
          { name: "Sample in a Jar", position: 1 },
          { name: "Bathtub Gin", position: 2 },
          { name: "Character Zero", position: 3 }
        ],
        set2: [
          { name: "Mike's Song", position: 0 },
          { name: "I Am Hydrogen", position: 1 },
          { name: "Weekapaug Groove", position: 2 },
          { name: "Ghost", position: 3 }
        ],
        encore: [
          { name: "Waste", position: 0 },
          { name: "First Tube", position: 1 }
        ]
      };

      // Use the test scoring endpoint
      const testResponse = await fetch('/api/test/score', {
        method: 'POST',
        body: JSON.stringify({
          prediction: predictionData.setlist,
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
      
      // Create a new scoring data object to update in context
      const newScoringData = {
        breakdown: scoreData.breakdown,
        actualSetlist: testSetlist,
        showDetails: showDetails,
        isLoading: false,
        error: null
      };
      
      // Enable scoring mode to display the score card
      toggleScoringMode();
      
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

{scoringMode && scoringData.actualSetlist && scoringData.breakdown ? (
          <ScoreCard 
            scoreBreakdown={scoringData.breakdown}
            actualSetlist={scoringData.actualSetlist}
            showDetails={scoringData.showDetails}
          />
        ) : (
          <div className={!selectedShow ? "opacity-50 pointer-events-none" : ""}>
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
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {scoringMode ? (
            <>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 font-medium py-3 px-4 rounded-lg transition-colors font-display text-lg"
                onClick={toggleScoringMode}
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