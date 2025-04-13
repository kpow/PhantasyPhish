import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePhishData } from "@/hooks/usePhishData";
import { formatShowDate } from "@/hooks/usePhishData";
import { Skeleton } from "@/components/ui/skeleton";
import { PhishShow } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SetlistSubmitModal from "@/components/setlist/SetlistSubmitModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<PhishShow | null>(null);

  const handlePickSetlist = (show: PhishShow) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a setlist prediction.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedShow(show);
    setIsModalOpen(true);
  };

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
    <>
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">next shows</h2>
          <div className="space-y-4">
            {/* Main upcoming show */}
            <MainUpcomingShow show={upcomingShows[0]} onPickSetlist={handlePickSetlist} />

            {/* Additional upcoming shows */}
            {upcomingShows.slice(1, 4).map((show) => (
              <AdditionalUpcomingShow 
                key={show.showid} 
                show={show} 
                onPickSetlist={handlePickSetlist} 
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal for selecting songs for the setlist */}
      <SetlistSubmitModal 
        show={selectedShow}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
