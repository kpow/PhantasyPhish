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
import { Setlist, PhishShow } from '@/types';

// Component for a single show card in the row
function ShowCard({ show, onViewSetlist, isLoading }: { 
  show: PhishShow, 
  onViewSetlist: (showId: string) => void,
  isLoading: boolean
}) {
  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
      <CardContent className="p-4">
        <h3 className="font-semibold text-white text-base mb-2">{formatShowDate(show.showdate)}</h3>
        <div className="text-[#E5E5E5] text-sm">
          <p>{show.venue}</p>
          <p className="truncate">{typeof show.location === 'string' ? show.location : ''}</p>
        </div>
        <div className="mt-3">
          <Button 
            variant="secondary" 
            className="w-full bg-gray-700 hover:bg-gray-600 font-medium py-1 px-3 rounded-lg transition-colors text-sm"
            onClick={() => onViewSetlist(show.showid)}
            disabled={isLoading}
          >
            View Setlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RecentShows() {
  const { recentShows, isLoadingRecentShows, fetchSetlist } = usePhishData();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewSetlist = async (showId: string) => {
    setIsLoading(true);
    
    try {
      const setlist = await fetchSetlist(showId);
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

  if (isLoadingRecentShows) {
    return (
      <div className="w-full mt-6">
        <h2 className="font-display text-xl mb-3 text-white">Recent Shows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-[#1E1E1E] rounded-xl shadow-lg">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-1" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recentShows || recentShows.length === 0) {
    return (
      <div className="w-full mt-6">
        <h2 className="font-display text-xl mb-3 text-white">Recent Shows</h2>
        <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
          <CardContent className="p-5">
            <p className="text-[#E5E5E5]">No recent shows found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="w-full mt-6">
        <h2 className="font-display text-xl mb-3 text-white">Recent Shows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recentShows.map((show) => (
            <ShowCard 
              key={show.showid}
              show={show}
              onViewSetlist={handleViewSetlist}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

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