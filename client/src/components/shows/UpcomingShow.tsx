import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePhishData } from '@/hooks/usePhishData';
import { formatShowDate } from '@/hooks/usePhishData';
import { Skeleton } from '@/components/ui/skeleton';
import { PhishShow } from '@/types';

// Main upcoming show component
function MainUpcomingShow({ show }: { show: PhishShow }) {
  return (
    <div className="p-4 bg-[#252525] rounded-lg">
      <div className="text-[#E5E5E5]">
        <p className="text-lg font-semibold">{formatShowDate(show.showdate)}</p>
        <p>{show.venue}</p>
        <p>{typeof show.location === 'string' ? show.location : ''}</p>
      </div>
      <div className="mt-4">
        <Button className="w-full bg-secondary hover:bg-purple-500 font-medium py-2 px-4 rounded-lg transition-colors">
          Make Prediction
        </Button>
      </div>
    </div>
  );
}

// Additional upcoming show component (smaller card)
function AdditionalUpcomingShow({ show }: { show: PhishShow }) {
  return (
    <div className="p-4 bg-[#252525] rounded-lg">
      <h3 className="font-semibold text-white text-base mb-2">{formatShowDate(show.showdate)}</h3>
      <div className="text-[#E5E5E5] text-sm">
        <p>{show.venue}</p>
        <p className="truncate">{typeof show.location === 'string' ? show.location : ''}</p>
      </div>
      <div className="mt-3">
        <Button 
          variant="outline" 
          className="w-full border-secondary text-secondary hover:bg-secondary/20 font-medium py-1 px-3 rounded-lg transition-colors text-sm"
        >
          Make Prediction
        </Button>
      </div>
    </div>
  );
}

export default function UpcomingShow() {
  const { upcomingShows, isLoadingUpcomingShow } = usePhishData();

  if (isLoadingUpcomingShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Next Shows</h2>
          <div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          
            {/* Loading skeletons for additional shows */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mt-4">
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

  if (!upcomingShows || upcomingShows.length === 0) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Next Shows</h2>
          <p className="text-[#E5E5E5]">No upcoming shows scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="font-display text-xl mb-3 text-white">Next Shows</h2>
        <div className="space-y-4">
          {/* Main upcoming show */}
          <MainUpcomingShow show={upcomingShows[0]} />
          
          {/* Additional upcoming shows */}
          {upcomingShows.slice(1, 4).map((show) => (
            <AdditionalUpcomingShow key={show.showid} show={show} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
