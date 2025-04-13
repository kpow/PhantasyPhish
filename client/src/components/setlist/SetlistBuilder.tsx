import React, { useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SetlistSection from './SetlistSection';
import { SetlistContext } from '@/contexts/SetlistContext';

export default function SetlistBuilder() {
  const { setlist, selectedSong, setSetlistSpot, reorderSongs, clearSetlist } = useContext(SetlistContext);
  const { toast } = useToast();

  const handleSubmitPrediction = async () => {
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
      const predictionData = {
        userId: 1, 
        showId: "upcoming-show", 
        set1: JSON.stringify(
          setlist.set1.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        ),
        set2: JSON.stringify(
          setlist.set2.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        ),
        encore: JSON.stringify(
          setlist.encore.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        ),
        score: 0, 
        created: new Date().toISOString()
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

      localStorage.setItem('savedPrediction', JSON.stringify(predictionData));

      toast({
        title: "Prediction Saved!",
        description: "Your setlist prediction has been saved for the upcoming show."
      });

      clearSetlist();
    } catch (error) {
      console.error('Error saving prediction:', error);

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
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg h-full">
      <CardContent className="p-5">
        <h2 className="font-display text-2xl mb-4 text-white">build-a-setlist</h2>

        <SetlistSection 
          title="Set 1"
          setType="set1"
          setItems={setlist.set1}
          titleColor="text-primary"
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
          height="h-[120px]"
          onSetSong={setSetlistSpot}
          onReorderSongs={reorderSongs}
          selectedSong={selectedSong}
        />

        <div className="mt-6 flex gap-2">
          <Button 
            className="w-full bg-primary hover:bg-blue-600 font-medium py-3 px-4 rounded-lg transition-colors font-display text-lg"
            onClick={handleSubmitPrediction}
          >
            submit setlist
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