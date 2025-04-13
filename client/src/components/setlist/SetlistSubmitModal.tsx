import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSetlist } from '@/contexts/SetlistContext';
import { useToast } from '@/hooks/use-toast';
import { PhishShow } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface SetlistSubmitModalProps {
  show: PhishShow | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetlistSubmitModal({ 
  show, 
  isOpen, 
  onOpenChange 
}: SetlistSubmitModalProps) {
  const { user } = useAuth();
  const { setlist, clearSetlist } = useSetlist();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitPrediction = async () => {
    if (!show || !user) {
      toast({
        title: "Error",
        description: "Missing show information or user not logged in.",
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

    setIsSubmitting(true);

    try {
      // Convert setlist format to match database schema
      const predictionData = {
        user_id: user.id,
        show_id: show.showid,
        setlist: {
          set1: setlist.set1.map((item) => item.song ? { id: item.song.id, name: item.song.name } : null),
          set2: setlist.set2.map((item) => item.song ? { id: item.song.id, name: item.song.name } : null),
          encore: setlist.encore.map((item) => item.song ? { id: item.song.id, name: item.song.name } : null)
        }
      };

      await apiRequest('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictionData)
      });

      toast({
        title: "Prediction Submitted!",
        description: `Your setlist prediction has been saved for ${show.venue} on ${new Date(show.showdate).toLocaleDateString()}.`
      });

      clearSetlist();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast({
        title: "Failed to submit prediction",
        description: "There was an error saving your prediction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] text-white border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Submit Setlist Prediction
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {show.venue} on {new Date(show.showdate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div>
            <h3 className="text-primary font-semibold mb-2">Set 1</h3>
            <div className="bg-[#252525] p-3 rounded-md">
              {setlist.set1.some((item) => item.song) ? (
                <ul>
                  {setlist.set1.map((item, i) => (
                    item.song && (
                      <li key={`set1-${i}`} className="mb-1">{item.song.name}</li>
                    )
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
              {setlist.set2.some((item) => item.song) ? (
                <ul>
                  {setlist.set2.map((item, i) => (
                    item.song && (
                      <li key={`set2-${i}`} className="mb-1">{item.song.name}</li>
                    )
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
              {setlist.encore.some((item) => item.song) ? (
                <ul>
                  {setlist.encore.map((item, i) => (
                    item.song && (
                      <li key={`encore-${i}`} className="mb-1">{item.song.name}</li>
                    )
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No songs selected</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button 
            variant="outline" 
            className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary hover:bg-blue-600"
            onClick={handleSubmitPrediction}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Confirm Submission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}