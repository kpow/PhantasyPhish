import React, { useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SetlistContext } from '@/contexts/SetlistContext';
import { useToast } from '@/hooks/use-toast';
import SetlistSection from './SetlistSection';

export default function SetlistBuilder() {
  const { setlist, selectedSong, setSetlistSpot, addSongToSet, reorderSongs, clearSetlist } = useContext(SetlistContext);
  const { toast } = useToast();
  
  const handleSubmitPrediction = async () => {
    // Check if there are any songs selected
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
      // Create the prediction data object
      const predictionData = {
        userId: 1, // For simplicity, we'll use a fixed userId
        showId: "upcoming-show", // This would normally come from the selected show
        set1: JSON.stringify(
          setlist.set1.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        ),
        set2: JSON.stringify(
          setlist.set2.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        ),
        encore: JSON.stringify(
          setlist.encore.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        ),
        score: 0, // Initial score before the show happens
        created: new Date().toISOString()
      };

      // Save to both API and localStorage for backup
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

      // Also save to localStorage as a backup
      localStorage.setItem('savedPrediction', JSON.stringify(predictionData));

      toast({
        title: "Prediction Saved!",
        description: "Your setlist prediction has been saved for the upcoming show."
      });

      // Clear the form
      clearSetlist();
    } catch (error) {
      console.error('Error saving prediction:', error);
      
      // Check if we can save to localStorage as a fallback
      try {
        const fallbackData = {
          showId: "upcoming-show",
          setlist: {
            set1: setlist.set1.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
            set2: setlist.set2.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
            encore: setlist.encore.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
          },
          created: new Date().toISOString()
        };
        localStorage.setItem('savedPrediction', JSON.stringify(fallbackData));
        
        toast({
          title: "Partially Saved",
          description: "Couldn't save to server, but your prediction is saved locally."
        });
      } catch (localError) {
        toast({
          title: "Failed to save prediction",
          description: "There was an error saving your prediction. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
      <CardContent className="p-5">
        <h2 className="font-display text-2xl mb-4 text-white">Build a Setlist</h2>
        
        {/* Set 1 */}
        <SetlistSection 
          title="Set 1"
          setType="set1"
          setItems={setlist.set1}
          titleColor="text-primary"
          maxItems={15}
          height="h-[240px]"
          onAddSong={addSongToSet}
          onSetSong={setSetlistSpot}
          onReorderSongs={reorderSongs}
          selectedSong={selectedSong}
        />
        
        {/* Set 2 */}
        <SetlistSection 
          title="Set 2"
          setType="set2"
          setItems={setlist.set2}
          titleColor="text-secondary"
          maxItems={15}
          height="h-[240px]"
          onAddSong={addSongToSet}
          onSetSong={setSetlistSpot}
          onReorderSongs={reorderSongs}
          selectedSong={selectedSong}
        />
        
        {/* Encore */}
        <SetlistSection 
          title="Encore"
          setType="encore"
          setItems={setlist.encore}
          titleColor="text-green-500"
          maxItems={5}
          height="h-[120px]"
          onAddSong={addSongToSet}
          onSetSong={setSetlistSpot}
          onReorderSongs={reorderSongs}
          selectedSong={selectedSong}
        />
        
        <div className="mt-6 flex gap-2">
          <Button 
            className="w-full bg-primary hover:bg-blue-600 font-medium py-3 px-4 rounded-lg transition-colors font-display text-lg"
            onClick={handleSubmitPrediction}
          >
            Submit Prediction
          </Button>
          <Button 
            variant="outline"
            className="bg-transparent text-white border-white hover:bg-gray-800"
            onClick={clearSetlist}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}