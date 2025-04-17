import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Trophy, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  userId: number;
  userName: string;
  totalScore: number;
  showsParticipated: number;
  bestScore: number;
  avatar: string | null;
}

interface Tour {
  id: number;
  name: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="w-5 inline-block text-center">{rank}</span>;
  }
};

const MedalEmoji = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="text-yellow-500 text-xl">👑</span>;
  if (rank === 2) return <span className="text-gray-400 text-xl">🥈</span>;
  if (rank === 3) return <span className="text-amber-700 text-xl">🥉</span>;
  return null;
};

export default function Leaderboard() {
  const [activeTour, setActiveTour] = useState<number | null>(null);
  
  // Fetch all tours
  const { data: tourData, isLoading: isLoadingTours } = useQuery<{ tours: Tour[] }>({
    queryKey: ['/api/tours']
  });
  
  // Fetch global leaderboard
  const { data: globalLeaderboardData, isLoading: isLoadingGlobal } = useQuery<{ leaderboard: LeaderboardEntry[] }>({
    queryKey: ['/api/leaderboard']
  });
  
  // Fetch tour leaderboard when a tour is selected
  const { data: tourLeaderboardData, isLoading: isLoadingTourLeaderboard } = useQuery<{
    tourName: string;
    leaderboard: LeaderboardEntry[];
  }>({
    queryKey: [`/api/tours/${activeTour}/leaderboard`],
    enabled: !!activeTour
  });
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-display mb-2">
          <Crown className="h-8 w-8 md:h-10 md:w-10 inline-block mr-2 text-yellow-500" />
          leaderboard
        </h1>
        <p className="text-lg text-muted-foreground">
          see who's crushing it with their Phish picks!
        </p>
      </div>
      
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="global">
            <Users className="h-4 w-4 mr-2" />
            global leaders
          </TabsTrigger>
          <TabsTrigger value="tour">
            <Trophy className="h-4 w-4 mr-2" />
            tour rankings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-display">global leaderboard</CardTitle>
              <CardDescription className="text-center">
                Top players across all concerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGlobal ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !globalLeaderboardData?.leaderboard || globalLeaderboardData.leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No scores recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 md:hidden gap-4 px-2">
                    {globalLeaderboardData.leaderboard.map((entry, index) => (
                      <div 
                        key={entry.userId} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg",
                          index < 3 ? "bg-primary/5" : ""
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 text-center">
                            {getRankIcon(index + 1)}
                          </div>
                          <Avatar className="h-10 w-10">
                            {entry.avatar ? (
                              <AvatarImage src={entry.avatar} alt={entry.userName} />
                            ) : null}
                            <AvatarFallback>
                              {entry.userName.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center">
                              {entry.userName} <MedalEmoji rank={index + 1} />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.showsParticipated} shows • Best: <span className="text-primary">{entry.bestScore}</span>
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-xl">{entry.totalScore}</div>
                      </div>
                    ))}
                  </div>
                  
                  <table className="w-full hidden md:table">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 w-16">Rank</th>
                        <th className="text-left py-3 px-4">Player</th>
                        <th className="text-right py-3 px-4">Shows</th>
                        <th className="text-right py-3 px-4">Best Show</th>
                        <th className="text-right py-3 px-4">Total Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalLeaderboardData.leaderboard.map((entry, index) => (
                        <tr 
                          key={entry.userId} 
                          className={cn(
                            "border-b border-border",
                            index < 3 ? "bg-primary/5" : ""
                          )}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                {entry.avatar ? (
                                  <AvatarImage src={entry.avatar} alt={entry.userName} />
                                ) : null}
                                <AvatarFallback>
                                  {entry.userName.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{entry.userName}</span>
                              <MedalEmoji rank={index + 1} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">{entry.showsParticipated}</td>
                          <td className="py-4 px-4 text-right text-primary font-medium">{entry.bestScore}</td>
                          <td className="py-4 px-4 text-right font-bold">{entry.totalScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tour">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-display">tour leaderboard</CardTitle>
              <CardDescription className="text-center">
                Select a tour to see rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTours ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !tourData?.tours || tourData.tours.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No tours available.
                </p>
              ) : (
                <div className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {tourData.tours.map(tour => (
                      <button
                        key={tour.id}
                        onClick={() => setActiveTour(tour.id)}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          activeTour === tour.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {tour.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTour ? (
                isLoadingTourLeaderboard ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !tourLeaderboardData?.leaderboard || tourLeaderboardData.leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No scores recorded for this tour yet.
                  </p>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-center mb-4">
                      {tourLeaderboardData.tourName}
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-1 md:hidden gap-4 px-2">
                        {tourLeaderboardData.leaderboard.map((entry, index) => (
                          <div 
                            key={entry.userId} 
                            className={cn(
                              "flex items-center justify-between p-4 rounded-lg",
                              index < 3 ? "bg-primary/5" : ""
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-8 text-center">
                                {getRankIcon(index + 1)}
                              </div>
                              <Avatar className="h-10 w-10">
                                {entry.avatar ? (
                                  <AvatarImage src={entry.avatar} alt={entry.userName} />
                                ) : null}
                                <AvatarFallback>
                                  {entry.userName.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium flex items-center">
                                  {entry.userName} <MedalEmoji rank={index + 1} />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {entry.showsParticipated} shows • Best: <span className="text-primary">{entry.bestScore}</span>
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-xl">{entry.totalScore}</div>
                          </div>
                        ))}
                      </div>
                      
                      <table className="w-full hidden md:table">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 w-16">Rank</th>
                            <th className="text-left py-3 px-4">Player</th>
                            <th className="text-right py-3 px-4">Shows</th>
                            <th className="text-right py-3 px-4">Best Show</th>
                            <th className="text-right py-3 px-4">Total Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tourLeaderboardData.leaderboard.map((entry, index) => (
                            <tr 
                              key={entry.userId} 
                              className={cn(
                                "border-b border-border",
                                index < 3 ? "bg-primary/5" : ""
                              )}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-center">
                                  {getRankIcon(index + 1)}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    {entry.avatar ? (
                                      <AvatarImage src={entry.avatar} alt={entry.userName} />
                                    ) : null}
                                    <AvatarFallback>
                                      {entry.userName.slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{entry.userName}</span>
                                  <MedalEmoji rank={index + 1} />
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">{entry.showsParticipated}</td>
                              <td className="py-4 px-4 text-right text-primary font-medium">{entry.bestScore}</td>
                              <td className="py-4 px-4 text-right font-bold">{entry.totalScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Select a tour to see the leaderboard
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}