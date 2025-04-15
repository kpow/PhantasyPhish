import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from "lucide-react";
import { formatShowDate } from "@/hooks/usePhishData";

interface Tour {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

interface Show {
  id: number;
  show_id: string;
  date: string;
  venue: string;
  city: string;
  state: string | null;
  country: string;
  tour_id: number | null;
  is_scored: boolean;
}

interface LeaderboardEntry {
  userId: number;
  userName: string;
  score: number;
}

interface TourLeaderboardEntry {
  userId: number;
  userName: string;
  totalScore: number;
  showsParticipated: number;
}

export default function Scoring() {
  const [activeTour, setActiveTour] = useState<number | null>(null);
  const [scoringStatus, setScoringStatus] = useState<Record<string, string>>({});
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // Fetch all tours
  const { data: tourData, isLoading: isLoadingTours } = useQuery<{ tours: Tour[] }>({
    queryKey: ['/api/tours'],
    enabled: isAuthenticated && user?.is_admin
  });
  
  // Fetch shows for selected tour
  const { data: showData, isLoading: isLoadingShows } = useQuery<{ shows: Show[] }>({
    queryKey: [`/api/tours/${activeTour}/shows`],
    enabled: !!activeTour && isAuthenticated && user?.is_admin
  });
  
  // Fetch tour leaderboard
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery<{ tourName: string, leaderboard: TourLeaderboardEntry[] }>({
    queryKey: [`/api/tours/${activeTour}/leaderboard`],
    enabled: !!activeTour && isAuthenticated && user?.is_admin
  });
  
  // Handle score all predictions for a show
  const scoreShow = async (showId: string) => {
    if (!isAuthenticated || !user?.is_admin) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to perform this action",
        variant: "destructive"
      });
      return;
    }
    
    setScoringStatus(prev => ({ ...prev, [showId]: 'scoring' }));
    
    try {
      const response = await fetch(`/api/admin/shows/${showId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to score show');
      }
      
      const result = await response.json();
      
      toast({
        title: "Scoring Complete",
        description: `Processed ${result.stats.processed} predictions with ${result.stats.errors} errors`,
        variant: "default"
      });
      
      setScoringStatus(prev => ({ ...prev, [showId]: 'scored' }));
    } catch (error) {
      console.error('Error scoring show:', error);
      toast({
        title: "Scoring Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      setScoringStatus(prev => ({ ...prev, [showId]: 'error' }));
    }
  };
  
  // Handle test scoring for a show (doesn't affect database)
  const testScoreShow = async (showId: string) => {
    if (!isAuthenticated || !user?.is_admin) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to perform this action",
        variant: "destructive"
      });
      return;
    }
    
    setScoringStatus(prev => ({ ...prev, [showId]: 'testing' }));
    
    try {
      const response = await fetch(`/api/admin/shows/${showId}/test-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to test score show');
      }
      
      const result = await response.json();
      
      toast({
        title: "Test Scoring Complete",
        description: `Test scored ${result.stats.scored} predictions with ${result.stats.errors} errors`,
        variant: "default"
      });
      
      // Display test results in console for now
      console.log('Test scoring results:', result);
      
      setScoringStatus(prev => ({ ...prev, [showId]: 'tested' }));
    } catch (error) {
      console.error('Error test scoring show:', error);
      toast({
        title: "Test Scoring Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      setScoringStatus(prev => ({ ...prev, [showId]: 'error' }));
    }
  };
  
  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Admin access required to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-primary mb-4">Score Management</h1>
        <p className="text-gray-400 mb-4">
          This page allows administrators to score shows and view leaderboards.
        </p>
        
        {isLoadingTours ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tourData && tourData.tours && tourData.tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {tourData.tours.map(tour => (
              <Card 
                key={tour.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${activeTour === tour.id ? 'border-primary border-2' : ''}`}
                onClick={() => setActiveTour(tour.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{tour.name}</h3>
                  <p className="text-sm text-gray-400">
                    {formatShowDate(tour.start_date)} - {formatShowDate(tour.end_date)}
                  </p>
                  {tour.description && <p className="text-xs mt-2">{tour.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No tours available.</p>
          </div>
        )}
      </div>
      
      {activeTour && (
        <Tabs defaultValue="shows">
          <TabsList className="mb-4">
            <TabsTrigger value="shows">Shows</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shows">
            <Card>
              <CardHeader>
                <CardTitle>Shows</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingShows ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !showData || !showData.shows || showData.shows.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No shows assigned to this tour yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {showData.shows.map(show => (
                      <div key={show.id} className="flex justify-between items-center p-3 border border-border rounded-md">
                        <div>
                          <h4 className="font-medium">{show.venue}</h4>
                          <p className="text-sm text-gray-400">
                            {/* Use the formatShowDate function for consistent date display */}
                            {formatShowDate(show.date)} | {show.city}, {show.state || show.country}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {show.is_scored ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                              Scored
                            </span>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => testScoreShow(show.show_id)}
                                disabled={scoringStatus[show.show_id] === 'testing' || scoringStatus[show.show_id] === 'scoring'}
                              >
                                {scoringStatus[show.show_id] === 'testing' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Testing...
                                  </>
                                ) : 'Test Score'}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => scoreShow(show.show_id)}
                                disabled={scoringStatus[show.show_id] === 'scoring' || scoringStatus[show.show_id] === 'testing'}
                              >
                                {scoringStatus[show.show_id] === 'scoring' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scoring...
                                  </>
                                ) : 'Score Show'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Tour Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingLeaderboard ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !leaderboardData || !leaderboardData.leaderboard || leaderboardData.leaderboard.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No scores recorded for this tour yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">Rank</th>
                          <th className="text-left py-3 px-4">User</th>
                          <th className="text-right py-3 px-4">Shows</th>
                          <th className="text-right py-3 px-4">Score</th>
                          <th className="text-right py-3 px-4">Avg. Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardData.leaderboard.map((entry, index) => (
                          <tr key={entry.userId} className="border-b border-border">
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4">{entry.userName}</td>
                            <td className="py-3 px-4 text-right">{entry.showsParticipated}</td>
                            <td className="py-3 px-4 text-right font-semibold">{entry.totalScore}</td>
                            <td className="py-3 px-4 text-right">
                              {entry.showsParticipated > 0 ? Math.round(entry.totalScore / entry.showsParticipated) : 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}