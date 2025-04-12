import React from 'react';
import Header from '@/components/layout/Header';
import UpcomingShow from '@/components/shows/UpcomingShow';
import RecentShow from '@/components/shows/RecentShow';
import SetlistBuilder from '@/components/setlist/SetlistBuilder';
import SongsList from '@/components/setlist/SongsList';
import { usePhishData } from '@/hooks/usePhishData';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { 
    isLoadingSongs, 
    isLoadingUpcomingShow, 
    isLoadingRecentShow 
  } = usePhishData();

  const isLoading = isLoadingSongs || isLoadingUpcomingShow || isLoadingRecentShow;

  return (
    <div className="min-h-screen bg-dark text-white" 
         style={{
           backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
           backgroundSize: '20px 20px',
           backgroundColor: '#121212'
         }}>
      <div className="container mx-auto px-4 py-8">
        <Header />

        {isLoading ? (
          <LoadingState />
        ) : (
          <MainContent />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
      <div className="lg:col-span-3 space-y-6">
        <Card className="bg-cardBg shadow-lg">
          <CardContent className="p-5">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
        <Card className="bg-cardBg shadow-lg">
          <CardContent className="p-5">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6 mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="bg-cardBg shadow-lg">
          <CardContent className="p-5">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6 mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
      
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
    </div>
  );
}

function MainContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
      <div className="lg:col-span-3 space-y-6">
        {/* Title Card */}
        <Card className="bg-[#1E1E1E] rounded-xl shadow-lg">
          <CardContent className="p-5">
            <h2 className="font-display text-2xl mb-2 text-white">Phantasy Phish</h2>
            <p className="text-[#E5E5E5]">Predict the setlist and score points based on what Phish actually plays!</p>
          </CardContent>
        </Card>

        {/* Upcoming Show Card */}
        <UpcomingShow />

        {/* Most Recent Show Card */}
        <RecentShow />
      </div>
      
      {/* Middle Column - Build a Setlist */}
      <div className="lg:col-span-5">
        <SetlistBuilder />
      </div>
      
      {/* Right Column - Song List */}
      <div className="lg:col-span-4">
        <SongsList />
      </div>
    </div>
  );
}
