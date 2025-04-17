import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePhishData } from "@/hooks/usePhishData";
import { formatShowDate } from "@/hooks/usePhishData";
import { Skeleton } from "@/components/ui/skeleton";
import { PhishShow } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSetlist } from "@/contexts/SetlistContextRefactored";
import { useScroll } from "@/contexts/ScrollContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { Trash2, Music, CircleCheck, CircleAlert, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ShowCardProps {
  show: PhishShow;
  onPickSetlist: (show: PhishShow) => void;
  hasPrediction?: boolean;
  onResetPrediction?: (show: PhishShow) => void;
}

// Unified show card component
function ShowCard({
  show,
  onPickSetlist,
  hasPrediction,
  onResetPrediction,
}: ShowCardProps) {
  return (
    <div className="p-4 bg-[#252525] rounded-lg">
      <div className="text-[#E5E5E5]">
        <p className="text-lg font-semibold">{formatShowDate(show.showdate)}</p>
        <p>{show.venue}</p>
        <p className="truncate">{typeof show.location === "string" ? show.location : ""}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          className="font-display bg-primary hover:bg-purple-500 font-medium py-2 px-2 rounded-lg transition-colors w-full flex items-center justify-center gap-2"
          onClick={() => onPickSetlist(show)}
        >
          <Music size={14} />
          <span>{hasPrediction ? "edit" : "pick"}</span>
        </Button>

        {hasPrediction && onResetPrediction && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                <span className="font-display">reset</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Prediction?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset your setlist picks for{" "}
                  {formatShowDate(show.showdate)}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onResetPrediction(show)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export default function UpcomingShow() {
  const { upcomingShows, isLoadingUpcomingShow } = usePhishData();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { setSelectedShow, loadPredictionForShow, deletePredictionForShow } =
    useSetlist();
  const { scrollToSet } = useScroll();
  const isMobile = useIsMobile();
  const [showPredictions, setShowPredictions] = useState<
    Record<string, boolean>
  >({});
  const [, setLocation] = useLocation();

  // Check which shows have predictions when component mounts
  const checkShowPredictions = async () => {
    if (isAuthenticated && upcomingShows?.length) {
      // Check each upcoming show to see if we have a prediction for it
      for (const show of upcomingShows) {
        try {
          const response = await fetch(
            `/api/users/current/predictions/${show.showid}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.prediction) {
              setShowPredictions((prev) => ({
                ...prev,
                [show.showid]: true,
              }));
            } else {
              setShowPredictions((prev) => ({
                ...prev,
                [show.showid]: false,
              }));
            }
          }
        } catch (error) {
          console.error(`Error checking picks for show ${show.showid}:`, error);
        }
      }
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkShowPredictions();
  }, [isAuthenticated, upcomingShows]);

  // Listen for prediction saved events
  useEffect(() => {
    const handlePredictionSaved = (event: Event) => {
      const customEvent = event as CustomEvent<{ showId: string }>;
      const showId = customEvent.detail.showId;

      // Update our local state to show the prediction exists
      setShowPredictions((prev) => ({
        ...prev,
        [showId]: true,
      }));
    };

    window.addEventListener("predictionSaved", handlePredictionSaved);

    return () => {
      window.removeEventListener("predictionSaved", handlePredictionSaved);
    };
  }, []);

  const handlePickSetlist = async (show: PhishShow) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a setlist.",
        variant: "destructive",
      });
      return;
    }

    // Set the selected show in the context
    setSelectedShow(show);

    // Try to load any existing prediction for this show
    await loadPredictionForShow(show.showid);

    // Navigate to the prediction URL
    setLocation(`/prediction/${show.showid}`);

    // Scroll to the setlist builder
    scrollToSet("set1");

    toast({
      title: "Show Selected",
      description: `Now build your setlist picks for ${formatShowDate(show.showdate)}.`,
    });
  };

  const handleResetPrediction = async (show: PhishShow) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const success = await deletePredictionForShow(show.showid);

      if (success) {
        // Update local state to reflect the prediction was deleted
        setShowPredictions((prev) => ({
          ...prev,
          [show.showid]: false,
        }));

        toast({
          title: "setlist pick reset",
          description: `Your setlist picks for ${formatShowDate(show.showdate)} has been reset.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reset setlist. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting setlist:", error);
      toast({
        title: "Error",
        description: "Failed to reset setlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingUpcomingShow) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-3 text-white">
            sprang tur 2025
          </h2>

          <div className={`relative ${isMobile ? 'px-4' : 'px-2'}`}>
            <Carousel className="w-full">
              <CarouselContent>
                {/* Loading skeletons for shows */}
                {[...Array(8)].map((_, i) => (
                  <CarouselItem key={i} className="basis-full">
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
                ))}
              </CarouselContent>
              <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1 py-2">
                <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
                <CarouselNext className="relative right-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
              </div>
            </Carousel>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!upcomingShows || upcomingShows.length === 0) {
    return (
      <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0">
        <CardContent className="p-5\2">
          <h2 className="font-display text-xl mb-3 text-white">Next Shows</h2>
          <p className="text-[#E5E5E5]">No upcoming shows scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  // Common carousel options without type errors
  const carouselOpts = {
    loop: true
  };

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden">
      <CardContent className="p-1">
        <h2 className="font-display text-xl mb-0 text-white p-3">
          sprang tur 2025
        </h2>

        <div className={`relative ${isMobile ? 'px-4' : 'px-2 mb-8'}`}>
          <Carousel
            opts={carouselOpts}
            className="w-full"
          >
            <CarouselContent>
              {/* All upcoming shows with the same card component */}
              {upcomingShows.map((show) => (
                <CarouselItem key={show.showid} className="basis-full">
                  <ShowCard
                    show={show}
                    onPickSetlist={handlePickSetlist}
                    hasPrediction={showPredictions[show.showid]}
                    onResetPrediction={handleResetPrediction}
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
      </CardContent>
    </Card>
  );
}
