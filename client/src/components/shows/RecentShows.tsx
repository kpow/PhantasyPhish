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
    <div className="p-4 bg-[#252525] rounded-lg">
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
    </div>
  );
}

export default function RecentShows() {
  const { recentShows, isLoadingRecentShows, fetchSetlist } = usePhishData();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentShowIndex, setCurrentShowIndex] = useState<number>(0);
  
  // Load a setlist for a specific show
  const loadSetlist = async (showId: string) => {
    setIsLoading(true);
    
    try {
      const setlist = await fetchSetlist(showId);
      setCurrentSetlist(setlist);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error fetching setlist:', error);
      setIsLoading(false);
      toast({
        title: "Failed to load setlist",
        description: "There was an error loading the setlist. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Handler for clicking on a show card
  const handleViewSetlist = async (showId: string) => {
    // Find the index of the clicked show
    const index = recentShows.findIndex(show => show.showid === showId);
    if (index !== -1) {
      setCurrentShowIndex(index);
      const success = await loadSetlist(showId);
      if (success) {
        setIsModalOpen(true);
      }
    }
  };
  
  // Navigate to previous show
  const goToPreviousShow = async () => {
    if (!recentShows || recentShows.length === 0) return;
    
    const newIndex = (currentShowIndex - 1 + recentShows.length) % recentShows.length;
    setCurrentShowIndex(newIndex);
    await loadSetlist(recentShows[newIndex].showid);
  };
  
  // Navigate to next show
  const goToNextShow = async () => {
    if (!recentShows || recentShows.length === 0) return;
    
    const newIndex = (currentShowIndex + 1) % recentShows.length;
    setCurrentShowIndex(newIndex);
    await loadSetlist(recentShows[newIndex].showid);
  };

  if (isLoadingRecentShows) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden w-full mt-6">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">recent shows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-[#252525] rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-1" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recentShows || recentShows.length === 0) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden w-full mt-0">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">recent shows</h2>
          <p className="text-[#E5E5E5]">No recent shows found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden w-full mt-0">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">recent shows</h2>
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
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-700 max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl text-white">
                  {currentSetlist && `Setlist for ${formatShowDate(currentSetlist.showdate)}`}
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  {currentSetlist && `${currentSetlist.venue}, ${currentSetlist.location}`}
                </DialogDescription>
              </div>
              
              <div className="flex space-x-2 mr-6">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full border-gray-600 hover:bg-gray-700"
                  onClick={goToPreviousShow}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  <span className="sr-only">Previous Show</span>
                </Button>
                
                <div className="text-sm text-gray-400 py-1 px-2 rounded-md bg-gray-800">
                  {currentShowIndex + 1} / {recentShows.length}
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full border-gray-600 hover:bg-gray-700"
                  onClick={goToNextShow}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  <span className="sr-only">Next Show</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <span className="ml-2">Loading setlist...</span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}