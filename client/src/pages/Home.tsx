import React, { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import UpcomingShow from "@/components/shows/UpcomingShow";
import RecentShows from "@/components/shows/RecentShows";
import SetlistBuilder from "@/components/setlist/SetlistBuilder";
import SongsList from "@/components/setlist/SongsList";
import ScoreCard from "@/components/setlist/ScoreCard";
import ScoringExplanation from "@/components/scoring/ScoringExplanation";
import { usePhishData } from "@/hooks/usePhishData";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetlist } from "@/contexts/SetlistContextRefactored";

export default function Home() {
  const { isLoadingSongs, isLoadingUpcomingShow, isLoadingRecentShows } =
    usePhishData();
  const [location] = useLocation();

  const isLoading =
    isLoadingSongs || isLoadingUpcomingShow || isLoadingRecentShows;

  return (
    <div className="container mx-auto px-4 py-0">
      {isLoading ? <LoadingState /> : <MainContent />}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
      {/* Left Column */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="bg-cardBg shadow-lg">
          <CardContent className="p-5">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>

        {/* Upcoming Shows Loading */}
        <div>
          <Card className="bg-cardBg shadow-lg">
            <CardContent className="p-5">
              <Skeleton className="h-8 w-2/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-cardBg shadow-lg mt-4">
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

      {/* Middle Column */}
      <div className="lg:col-span-5">
        <Card className="bg-cardBg shadow-lg">
          <CardContent className="p-5">
            <Skeleton className="h-8 w-1/3 mb-6" />
            {[...Array(3)].map((_, i) => (
              <div key={`set-${i}`} className="mb-6">
                <Skeleton className="h-6 w-1/6 mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={`song-${i}-${j}`} className="flex">
                      <Skeleton className="h-10 w-10 mr-3" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Skeleton className="h-12 w-full mt-4" />
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-4">
        <Card className="bg-cardBg shadow-lg">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={`list-${i}`} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shows Row (Full Width) */}
      <div className="lg:col-span-12 mt-4">
        <Skeleton className="h-8 w-1/6 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-cardBg shadow-lg">
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
    </div>
  );
}

function MainContent() {
  const { isInScoringMode, scoringData } = useSetlist();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-0">
      {/* Left Column */}
      <div className="lg:col-span-3 space-y-6">
        {/* Title Card */}
        <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
          <CardContent className="p-5">
            <h2 className="font-display text-2xl mb-2 text-white">whazzup</h2>
            <p className="text-[#E5E5E5]">
              pick the setlist and score points based on what Phish actually
              plays!
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Shows Cards */}
        <UpcomingShow />

        {/* Scoring Explanation */}
        <ScoringExplanation />
      </div>

      {isInScoringMode ? (
        /* When in scoring mode, ScoreCard takes up the full middle and right columns */
        <div className="lg:col-span-9">
          {scoringData.isLoading ? (
            <Card className="bg-[#1E1E1E] rounded-xl shadow-lg p-5 h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center py-6">
                  <div className="mb-4 text-primary">
                    Loading setlist data...
                  </div>
                  <div className="animate-pulse h-6 w-32 bg-primary/20 rounded-md mx-auto mb-3"></div>
                  <div className="animate-pulse h-4 w-48 bg-gray-700 rounded-md mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ) : scoringData.error ? (
            <Card className="bg-[#1E1E1E] rounded-xl shadow-lg p-5 h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center py-6 text-red-400">
                  <div className="mb-2">Error loading score data:</div>
                  <div className="text-sm">{scoringData.error}</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScoreCard
              scoreBreakdown={scoringData.breakdown!}
              actualSetlist={scoringData.actualSetlist}
              showDetails={scoringData.showDetails}
            />
          )}
        </div>
      ) : (
        /* Normal mode - middle column with setlist builder and right column with song list */
        <>
          {/* Middle Column - Build a Setlist */}
          <div className="lg:col-span-5">
            <SetlistBuilder />
          </div>

          {/* Right Column - Song List */}
          <div className="lg:col-span-4">
            <SongsList />
          </div>
        </>
      )}

      {/* Recent Shows Row (Full Width) */}
      <div className="lg:col-span-12">
        <RecentShows />
      </div>
    </div>
  );
}
