import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePhishData } from '@/hooks/usePhishData';
import { formatShowDate } from '@/hooks/usePhishData';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Setlist } from '@/types';

export default function RecentShow() {
  const { recentShow, isLoadingRecentShow, fetchSetlist } = usePhishData();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewSetlist = async () => {
    if (!recentShow) return;
    
    setIsLoading(true);
    
    try {
      const setlist = await fetchSetlist(recentShow.showid);
      setCurrentSetlist(setlist);
      setIsModalOpen(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching setlist:', error);
      setIsLoading(false);
      toast({
        title: "Failed to load setlist",
        description: "There was an error loading the setlist. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingRecentShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Most Recent Show</h2>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recentShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Most Recent Show</h2>
          <p className="text-[#E5E5E5]">No recent shows found.</p>
        </CardContent>
      </Card>
    );
  }

  // Create location string from city and state
  const location = recentShow ? `${recentShow.city}, ${recentShow.state}` : '';

  return (
    <>
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Most Recent Show</h2>
          <div className="text-[#E5E5E5]">
            <p className="text-lg font-semibold">{formatShowDate(recentShow.showdate)}</p>
            <p>{recentShow.venue}</p>
            <p>{location}</p>
          </div>
          <div className="mt-4">
            <Button 
              variant="secondary" 
              className="w-full bg-gray-700 hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
              onClick={handleViewSetlist}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "View Setlist"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-700 max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {currentSetlist && `Setlist for ${formatShowDate(currentSetlist.showdate)}`}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {currentSetlist && `${currentSetlist.venue}, ${currentSetlist.location}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 text-white whitespace-pre-wrap overflow-y-auto max-h-[60vh] font-medium">
            {currentSetlist?.setlistdata}
          </div>
          
          {currentSetlist?.setlistnotes && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-gray-300 mb-1">Notes:</h4>
              <div className="text-sm text-gray-300">
                {currentSetlist.setlistnotes}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
