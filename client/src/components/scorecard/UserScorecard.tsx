import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Clock, CalendarDays } from 'lucide-react';
import { formatShowDate } from '@/hooks/usePhishData';

interface Tour {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

interface TourScore {
  userId: number;
  tourId: number;
  totalScore: number;
  showsParticipated: number;
}

export default function UserScorecard({ className }: { className?: string }) {
  const { user } = useAuth();
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  
  // Fetch all available tours
  const { data: tourData, isLoading: isLoadingTours } = useQuery<{ tours: Tour[] }>({
    queryKey: ['/api/tours'],
    enabled: !!user?.id
  });
  
  // After tour data is loaded, set the default selected tour to the first available
  React.useEffect(() => {
    if (tourData?.tours && tourData.tours.length > 0 && !selectedTourId) {
      setSelectedTourId(tourData.tours[0].id);
    }
  }, [tourData, selectedTourId]);
  
  // Fetch user score for the selected tour
  const { data: userScore, isLoading: isLoadingScore } = useQuery<TourScore>({
    queryKey: [`/api/users/current/tours/${selectedTourId}/score`],
    enabled: !!user?.id && !!selectedTourId
  });
  
  // Fetch tour leaderboard
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery<{ 
    leaderboard: Array<{
      userId: number;
      userName: string;
      totalScore: number;
      showsParticipated: number;
      bestScore: number;
      avatar: string | null;
    }> 
  }>({
    queryKey: [`/api/tours/${selectedTourId}/leaderboard`],
    enabled: !!selectedTourId
  });
  
  // Get user's rank in the leaderboard if available
  const getUserRank = () => {
    if (!leaderboardData?.leaderboard || !user?.id) return null;
    
    const userRankEntry = leaderboardData.leaderboard.findIndex(entry => entry.userId === user.id);
    return userRankEntry !== -1 ? userRankEntry + 1 : null;
  };
  
  const userRank = getUserRank();
  
  // Render loading skeleton
  if (isLoadingTours || (isLoadingScore && selectedTourId)) {
    return (
      <Card className={`${className || ''} bg-[#1A1A1A] border-0 shadow-lg`}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg sm:col-span-2" />
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state if no tours or user not logged in
  if (!tourData?.tours || tourData.tours.length === 0 || !user?.id) {
    return (
      <Card className={`${className || ''} bg-[#1A1A1A] border-0 shadow-lg`}>
        <CardHeader>
          <CardTitle className="text-white text-lg">Your Scorecard</CardTitle>
          <CardDescription>No tour data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            {!user?.id 
              ? "Please log in to view your scorecard" 
              : "No tours found in the database. Check back later."}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`${className || ''} bg-[#1A1A1A] border-0 shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" /> 
          Your Scorecard
        </CardTitle>
        <CardDescription>
          <Tabs 
            defaultValue={selectedTourId?.toString() || tourData.tours[0].id.toString()} 
            onValueChange={(value) => setSelectedTourId(parseInt(value))}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto">
              {tourData.tours.map(tour => (
                <TabsTrigger 
                  key={tour.id} 
                  value={tour.id.toString()}
                  className="text-xs py-1 px-2 h-auto"
                >
                  {tour.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2">
        {tourData.tours.map(tour => (
          <TabsContent key={tour.id} value={tour.id.toString()} className="mt-0 pt-4">
            <div className="mb-2 text-xs text-gray-400 flex items-center">
              <CalendarDays className="h-3 w-3 mr-1" />
              {formatShowDate(tour.start_date)} - {formatShowDate(tour.end_date)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {/* Tour Score Card */}
              <div className="bg-[#252525] p-4 rounded-lg">
                <h3 className="text-primary font-medium text-sm mb-2 flex items-center">
                  <Medal className="mr-2 h-4 w-4" /> Total Score
                </h3>
                {isLoadingScore ? (
                  <Skeleton className="h-10 w-full" />
                ) : userScore ? (
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {userScore.totalScore}
                      <span className="text-xs text-gray-400 ml-2">
                        points
                      </span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      From {userScore.showsParticipated} show{userScore.showsParticipated !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No scores available</p>
                )}
              </div>
              
              {/* Ranking Card */}
              <div className="bg-[#252525] p-4 rounded-lg">
                <h3 className="text-primary font-medium text-sm mb-2 flex items-center">
                  <Trophy className="mr-2 h-4 w-4" /> Your Ranking
                </h3>
                {isLoadingLeaderboard ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div>
                    {userRank ? (
                      <>
                        <p className="text-2xl font-bold text-white">
                          #{userRank}
                          <span className="text-xs text-gray-400 ml-2">
                            of {leaderboardData?.leaderboard.length || 0} players
                          </span>
                        </p>
                        <div className="flex mt-2">
                          {userRank === 1 && (
                            <Badge className="bg-yellow-500 text-black">
                              Tour Leader
                            </Badge>
                          )}
                          {userRank <= 3 && userRank > 1 && (
                            <Badge className="bg-slate-400">
                              Top 3
                            </Badge>
                          )}
                          {userRank <= 10 && userRank > 3 && (
                            <Badge className="bg-amber-700">
                              Top 10
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        Not ranked yet - submit predictions for upcoming shows!
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Average Score Card */}
              {userScore && userScore.showsParticipated > 0 && (
                <div className="bg-[#252525] p-4 rounded-lg sm:col-span-2">
                  <h3 className="text-primary font-medium text-sm mb-2 flex items-center">
                    <Clock className="mr-2 h-4 w-4" /> Average Score
                  </h3>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(userScore.totalScore / userScore.showsParticipated)}
                    <span className="text-xs text-gray-400 ml-2">
                      points per show
                    </span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </CardContent>
    </Card>
  );
}