import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePhishData } from "@/hooks/usePhishData";
import { formatShowDate } from "@/hooks/usePhishData";
import { Skeleton } from "@/components/ui/skeleton";
import { PhishShow } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSetlist } from "@/contexts/SetlistContext";
import { useScroll } from "@/contexts/ScrollContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ShowCardProps {
  show: PhishShow;
  onPickSetlist: (show: PhishShow) => void;
}

// Main upcoming show component
function MainUpcomingShow({ show, onPickSetlist }: ShowCardProps) {
  return (
    <div className="p-4 bg-[#252525] rounded-lg">
      <div className="text-[#E5E5E5]">
        <p className="text-lg font-semibold">{formatShowDate(show.showdate)}</p>
        <p>{show.venue}</p>
        <p>{typeof show.location === "string" ? show.location : ""}</p>
      </div>
      <div className="mt-4 text-center">
        <Button 
          className="font-display bg-primary hover:bg-purple-500 font-medium py-2 px-4 rounded-lg transition-colors"
          onClick={() => onPickSetlist(show)}
        >
          pick a setlist
        </Button>
      </div>
    </div>
  );
}

// Additional upcoming show component (smaller card)
function AdditionalUpcomingShow({ show, onPickSetlist }: ShowCardProps) {
  return (
    <div className="p-4 bg-[#252525] rounded-lg">
      <h3 className="font-semibold text-white text-base mb-2">
        {formatShowDate(show.showdate)}
      </h3>
      <div className="text-[#E5E5E5] text-sm">
        <p>{show.venue}</p>
        <p className="truncate">
          {typeof show.location === "string" ? show.location : ""}
        </p>
      </div>
      <div className="mt-3 text-center">
        <Button 
          className="font-display bg-primary hover:bg-purple-500 font-medium py-2 px-4 rounded-lg transition-colors"
          onClick={() => onPickSetlist(show)}
        >
          pick a setlist
        </Button>
      </div>
    </div>
  );
}

export default function UpcomingShow() {
  const { upcomingShows, isLoadingUpcomingShow } = usePhishData();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { setSelectedShow, loadPredictionForShow } = useSetlist();
  const { scrollToSet } = useScroll();
  const isMobile = useIsMobile();

  const handlePickSetlist = async (show: PhishShow) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a setlist prediction.",
        variant: "destructive"
      });
      return;
    }
    
    // Set the selected show in the context
    setSelectedShow(show);
    
    // Try to load any existing prediction for this show
    await loadPredictionForShow(show.showid);
    
    // Scroll to the setlist builder
    scrollToSet('set1');
    
    toast({
      title: "Show Selected",
      description: `Now build your setlist prediction for ${formatShowDate(show.showdate)}.`
    });
  };

  if (isLoadingUpcomingShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">Next Shows</h2>
          
          {isMobile ? (
            <div className="relative px-4">
              <Carousel className="w-full">
                <CarouselContent>
                  {/* Main show skeleton */}
                  <CarouselItem className="basis-full">
                    <div className="p-4 bg-[#252525] rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="mt-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    </div>
                  </CarouselItem>
                  
                  {/* Additional shows skeletons */}
                  {[...Array(3)].map((_, i) => (
                    <CarouselItem key={i} className="basis-full">
                      <div className="p-4 bg-[#252525] rounded-lg">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-2/3 mb-3" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1 py-2">
                  <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
                  <CarouselNext className="relative right-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
                </div>
              </Carousel>
            </div>
          ) : (
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
          )}
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
        <h2 className="font-display text-xl mb-3 text-white">next shows</h2>
        
        {isMobile ? (
          <div className="relative px-4">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {/* Main upcoming show as first slide */}
                <CarouselItem className="basis-full">
                  <MainUpcomingShow 
                    show={upcomingShows[0]} 
                    onPickSetlist={handlePickSetlist} 
                  />
                </CarouselItem>
                
                {/* Additional upcoming shows as separate slides */}
                {upcomingShows.slice(1, 4).map((show) => (
                  <CarouselItem key={show.showid} className="basis-full">
                    <AdditionalUpcomingShow
                      show={show}
                      onPickSetlist={handlePickSetlist}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1 py-2">
                <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
                <CarouselNext className="relative right-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
              </div>
            </Carousel>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main upcoming show */}
            <MainUpcomingShow 
              show={upcomingShows[0]} 
              onPickSetlist={handlePickSetlist} 
            />

            {/* Additional upcoming shows */}
            {upcomingShows.slice(1, 4).map((show) => (
              <AdditionalUpcomingShow 
                key={show.showid} 
                show={show} 
                onPickSetlist={handlePickSetlist} 
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
