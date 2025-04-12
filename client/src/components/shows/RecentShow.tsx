import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePhishData } from '@/hooks/usePhishData';
import { formatShowDate } from '@/hooks/usePhishData';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function RecentShow() {
  const { recentShow, isLoadingRecentShow, fetchSetlist } = usePhishData();
  const { toast } = useToast();

  const handleViewSetlist = async () => {
    if (!recentShow) return;
    
    try {
      const setlist = await fetchSetlist(recentShow.showid);
      
      toast({
        title: `Setlist for ${formatShowDate(recentShow.showdate)}`,
        description: (
          <div className="mt-2 text-sm whitespace-pre-wrap">
            {setlist.setlistdata}
          </div>
        ),
        duration: 10000,
      });
    } catch (error) {
      console.error('Error fetching setlist:', error);
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

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
      <CardContent className="p-5">
        <h2 className="font-display text-xl mb-3 text-white">Most Recent Show</h2>
        <div className="text-[#E5E5E5]">
          <p className="text-lg font-semibold">{formatShowDate(recentShow.showdate)}</p>
          <p>{recentShow.venue}</p>
          <p>{recentShow.location}</p>
        </div>
        <div className="mt-4">
          <Button 
            variant="secondary" 
            className="w-full bg-gray-700 hover:bg-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={handleViewSetlist}
          >
            View Setlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
