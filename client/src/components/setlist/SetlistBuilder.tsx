import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SetlistSection from './SetlistSection';
import { useSetlist } from '@/contexts/SetlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatShowDate } from '@/hooks/usePhishData';

export default function SetlistBuilder() {
  const { setlist, selectedSong, selectedShow, setSetlistSpot, reorderSongs, clearSetlist, resetSetlistAndShow, loadPredictionForShow } = useSetlist();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

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

        <div className={!selectedShow ? "opacity-50 pointer-events-none" : ""}>
          <SetlistSection 
            title="Set 1"
            setType="set1"
            setItems={setlist.set1}
            titleColor="text-primary"
            borderColor="border-primary"
            height="h-[240px]"
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
            height="h-[240px]"
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
            height="h-[120px]"
            onSetSong={setSetlistSpot}
            onReorderSongs={reorderSongs}
            selectedSong={selectedSong}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <Button 
            className="w-full bg-primary hover:bg-blue-600 font-medium py-3 px-4 rounded-lg transition-colors font-display text-lg"
            onClick={handleSubmitPrediction}
            disabled={!selectedShow || isSubmitting}
          >
            {isSubmitting 
              ? "Saving..." 
              : selectedShow 
                ? "submit setlist" 
                : "select a show first"
            }
          </Button>
          <Button 
            variant="outline"
            className="bg-transparent text-white border-white hover:bg-gray-800"
            onClick={resetSetlistAndShow}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}