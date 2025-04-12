import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePhishData } from '@/hooks/usePhishData';
import { formatShowDate } from '@/hooks/usePhishData';
import { Skeleton } from '@/components/ui/skeleton';

export default function UpcomingShow() {
  const { upcomingShow, isLoadingUpcomingShow } = usePhishData();

  if (isLoadingUpcomingShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Upcoming Show</h2>
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

  if (!upcomingShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Upcoming Show</h2>
          <p className="text-[#E5E5E5]">No upcoming shows scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
      <CardContent className="p-5">
        <h2 className="font-display text-xl mb-3 text-white">Upcoming Show</h2>
        <div className="text-[#E5E5E5]">
          <p className="text-lg font-semibold">{formatShowDate(upcomingShow.showdate)}</p>
          <p>{upcomingShow.venue}</p>
          <p>{upcomingShow.location}</p>
        </div>
        <div className="mt-4">
          <Button className="w-full bg-secondary hover:bg-purple-500 font-medium py-2 px-4 rounded-lg transition-colors">
            Make Prediction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
