import React, { useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SetlistContext } from '@/contexts/SetlistContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function SetlistBuilder() {
  const { setlist, setSetlistSpot, clearSetlist } = useContext(SetlistContext);
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
      // For now, we'll just save it locally since we don't have user auth
      const prediction = {
        showId: "upcoming-show", // This would normally come from the selected show
        setlist: {
          set1: setlist.set1.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
          set2: setlist.set2.map(item => item.song ? { id: item.song.id, name: item.song.name } : null),
          encore: setlist.encore.map(item => item.song ? { id: item.song.id, name: item.song.name } : null)
        },
        created: new Date()
      };

      localStorage.setItem('savedPrediction', JSON.stringify(prediction));

      toast({
        title: "Prediction Saved!",
        description: "Your setlist prediction has been saved.",
      });

      // Clear the form
      clearSetlist();
    } catch (error) {
      console.error('Error saving prediction:', error);
      toast({
        title: "Failed to save prediction",
        description: "There was an error saving your prediction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderSetlistSpot = (set: 'set1' | 'set2' | 'encore', position: number) => {
    const currentItem = setlist[set][position];
    const songName = currentItem.song ? currentItem.song.name : 'Click to add a song';
    const textColor = currentItem.song ? 'text-white' : 'text-gray-500';
    
    return (
      <div 
        className={`flex-1 border border-gray-700 rounded-lg p-3 ${textColor} hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer`}
        onClick={() => {
          // If there's already a selected song in context, add it here
          const { selectedSong } = useContext(SetlistContext);
          if (selectedSong) {
            setSetlistSpot(set, position, selectedSong);
          }
        }}
      >
        {songName}
      </div>
    );
  };

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
      <CardContent className="p-5">
        <h2 className="font-display text-2xl mb-4 text-white">Build a Setlist</h2>
        
        {/* Set 1 */}
        <div className="mb-6">
          <h3 className="font-display text-xl mb-3 text-primary">Set 1</h3>
          <div className="space-y-2">
            {setlist.set1.map((_, index) => (
              <div key={`set1-${index}`} className="flex items-center">
                <span className="font-display text-lg mr-3 text-primary">{index + 1}</span>
                {renderSetlistSpot('set1', index)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Set 2 */}
        <div className="mb-6">
          <h3 className="font-display text-xl mb-3 text-secondary">Set 2</h3>
          <div className="space-y-2">
            {setlist.set2.map((_, index) => (
              <div key={`set2-${index}`} className="flex items-center">
                <span className="font-display text-lg mr-3 text-secondary">{index + 1}</span>
                {renderSetlistSpot('set2', index)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Encore */}
        <div>
          <h3 className="font-display text-xl mb-3 text-green-500">Encore</h3>
          <div className="space-y-2">
            {setlist.encore.map((_, index) => (
              <div key={`encore-${index}`} className="flex items-center">
                <span className="font-display text-lg mr-3 text-green-500">{index + 1}</span>
                {renderSetlistSpot('encore', index)}
              </div>
            ))}
          </div>
        </div>
        
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
