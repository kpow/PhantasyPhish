import React, { useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SetlistContext } from '@/contexts/SetlistContext';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export default function SetlistBuilder() {
  const { setlist, selectedSong, setSetlistSpot, addSongToSet, clearSetlist } = useContext(SetlistContext);
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
        // For simplicity, we'll use a fixed userId. In a real app, this would come from auth
        userId: 1,
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

  const renderSetlistSpot = (set: 'set1' | 'set2' | 'encore', position: number) => {
    const currentItem = setlist[set][position];
    const songName = currentItem.song ? currentItem.song.name : 'Click to add a song';
    const textColor = currentItem.song ? 'text-white' : 'text-gray-500';
    
    const handleClick = () => {
      // If there's a selected song, add it here
      if (selectedSong) {
        setSetlistSpot(set, position, selectedSong);
      } else if (currentItem.song) {
        // If clicking on a song that's already set, remove it
        setSetlistSpot(set, position, null);
      }
    };
    
    return (
      <div 
        className={`flex-1 border border-gray-700 rounded-lg p-3 ${textColor} 
        ${selectedSong ? 'hover:bg-green-900/30' : 'hover:bg-[rgba(255,255,255,0.1)]'} 
        ${currentItem.song ? 'border-primary/50' : 'border-gray-700'}
        transition-colors cursor-pointer`}
        onClick={handleClick}
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
          <div className="border border-gray-800 rounded-lg overflow-hidden mb-2">
            <ScrollArea className="h-[240px] pr-4"> {/* Fixed height of 5 items (approximately) */}
              <div className="space-y-2 p-2">
                {setlist.set1.map((_, index) => (
                  <div key={`set1-${index}`} className="flex items-center">
                    <span className="font-display text-lg mr-3 text-primary w-6 text-center">{index + 1}</span>
                    {renderSetlistSpot('set1', index)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          {setlist.set1.length < 15 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white"
              onClick={() => addSongToSet('set1')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Button>
          )}
        </div>
        
        {/* Set 2 */}
        <div className="mb-6">
          <h3 className="font-display text-xl mb-3 text-secondary">Set 2</h3>
          <div className="border border-gray-800 rounded-lg overflow-hidden mb-2">
            <ScrollArea className="h-[240px] pr-4"> {/* Fixed height of 5 items (approximately) */}
              <div className="space-y-2 p-2">
                {setlist.set2.map((_, index) => (
                  <div key={`set2-${index}`} className="flex items-center">
                    <span className="font-display text-lg mr-3 text-secondary w-6 text-center">{index + 1}</span>
                    {renderSetlistSpot('set2', index)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          {setlist.set2.length < 15 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white"
              onClick={() => addSongToSet('set2')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Button>
          )}
        </div>
        
        {/* Encore */}
        <div>
          <h3 className="font-display text-xl mb-3 text-green-500">Encore</h3>
          <div className="border border-gray-800 rounded-lg overflow-hidden mb-2">
            <ScrollArea className="h-[120px] pr-4"> {/* Half height for encore (only need 2-3 items) */}
              <div className="space-y-2 p-2">
                {setlist.encore.map((_, index) => (
                  <div key={`encore-${index}`} className="flex items-center">
                    <span className="font-display text-lg mr-3 text-green-500 w-6 text-center">{index + 1}</span>
                    {renderSetlistSpot('encore', index)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          {setlist.encore.length < 5 && ( // Encores are usually shorter
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white"
              onClick={() => addSongToSet('encore')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Button>
          )}
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
