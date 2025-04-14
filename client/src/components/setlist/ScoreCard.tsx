import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScoringBreakdown, ProcessedSetlist } from '@shared/types';

interface ScoreCardProps {
  scoreBreakdown: ScoringBreakdown;
  actualSetlist: ProcessedSetlist;
  showDetails?: {
    date: string;
    venue: string;
    location: string;
  };
}

export default function ScoreCard({ scoreBreakdown, actualSetlist, showDetails }: ScoreCardProps) {
  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <Card className="bg-[#1E1E1E] border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-white flex justify-between items-center">
            <span>Score: <span className="text-green-400">{scoreBreakdown.totalScore}</span></span>
            {showDetails && (
              <span className="text-sm text-gray-300">
                {showDetails.date} | {showDetails.venue}, {showDetails.location}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="bg-[#252525] p-2 rounded-md text-center">
              <p className="text-xs text-gray-400">Song in Show</p>
              <div className="mt-1 flex justify-center items-center space-x-1">
                <span className="font-bold text-white">{scoreBreakdown.songInShow.count}×</span>
                <span className="text-sm text-gray-300">3 pts</span>
              </div>
              <p className="text-green-400 font-bold text-sm mt-1">{scoreBreakdown.songInShow.points}</p>
            </div>
            
            <div className="bg-[#252525] p-2 rounded-md text-center">
              <p className="text-xs text-gray-400">Song in Set</p>
              <div className="mt-1 flex justify-center items-center space-x-1">
                <span className="font-bold text-white">{scoreBreakdown.songInSet.count}×</span>
                <span className="text-sm text-gray-300">6 pts</span>
              </div>
              <p className="text-green-400 font-bold text-sm mt-1">{scoreBreakdown.songInSet.points}</p>
            </div>
            
            <div className="bg-[#252525] p-2 rounded-md text-center">
              <p className="text-xs text-gray-400">Correct Song</p>
              <div className="mt-1 flex justify-center items-center space-x-1">
                <span className="font-bold text-white">{scoreBreakdown.correctSong.count}×</span>
                <span className="text-sm text-gray-300">10 pts</span>
              </div>
              <p className="text-green-400 font-bold text-sm mt-1">{scoreBreakdown.correctSong.points}</p>
            </div>
            
            <div className="bg-[#252525] p-2 rounded-md text-center">
              <p className="text-xs text-gray-400">Special Songs</p>
              <div className="mt-1 flex justify-center items-center space-x-1">
                <span className="font-bold text-white">{scoreBreakdown.correctSpecial.count}×</span>
                <span className="text-sm text-gray-300">15 pts</span>
              </div>
              <p className="text-green-400 font-bold text-sm mt-1">{scoreBreakdown.correctSpecial.points}</p>
            </div>
            
            <div className="bg-[#252525] p-2 rounded-md text-center">
              <p className="text-xs text-gray-400">Encore</p>
              <div className="mt-1 flex justify-center items-center space-x-1">
                <span className="font-bold text-white">{scoreBreakdown.encoreInSet.count}×</span>
                <span className="text-sm text-gray-300">10 pts</span>
              </div>
              <p className="text-green-400 font-bold text-sm mt-1">{scoreBreakdown.encoreInSet.points}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Breakdown Table */}
      <Card className="bg-[#1E1E1E] border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Song Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Song</TableHead>
                  <TableHead className="text-white">Your Prediction</TableHead>
                  <TableHead className="text-white">Actual</TableHead>
                  <TableHead className="text-white text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreBreakdown.details.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-white">{detail.songName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          detail.predictedSet === 'set1' ? 'border-primary text-primary' : 
                          detail.predictedSet === 'set2' ? 'border-orange-500 text-orange-500' : 
                          'border-green-500 text-green-500'
                        }
                      >
                        {detail.predictedSet === 'set1' ? 'Set 1' : 
                         detail.predictedSet === 'set2' ? 'Set 2' : 'Encore'}
                        {' #'}
                        {detail.predictedPosition + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {detail.actualSet ? (
                        <Badge 
                          variant="outline" 
                          className={
                            detail.actualSet === 'set1' ? 'border-primary text-primary' : 
                            detail.actualSet === 'set2' ? 'border-orange-500 text-orange-500' : 
                            'border-green-500 text-green-500'
                          }
                        >
                          {detail.actualSet === 'set1' ? 'Set 1' : 
                           detail.actualSet === 'set2' ? 'Set 2' : 'Encore'}
                          {' #'}
                          {(detail.actualPosition as number) + 1}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">Not played</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={detail.points > 0 ? "text-green-400 font-bold" : "text-gray-500"}>
                        {detail.points}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Actual Setlist Card */}
      <Card className="bg-[#1E1E1E] border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Actual Setlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actualSetlist.set1.length > 0 && (
              <div>
                <h3 className="text-primary font-semibold mb-2">Set 1</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  <ol className="list-decimal pl-5">
                    {actualSetlist.set1.map((song, i) => (
                      <li key={`set1-${i}`} className="mb-1 text-white">{song.name}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            
            {actualSetlist.set2.length > 0 && (
              <div>
                <h3 className="text-orange-500 font-semibold mb-2">Set 2</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  <ol className="list-decimal pl-5">
                    {actualSetlist.set2.map((song, i) => (
                      <li key={`set2-${i}`} className="mb-1 text-white">{song.name}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            
            {actualSetlist.encore.length > 0 && (
              <div>
                <h3 className="text-green-500 font-semibold mb-2">Encore</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  <ol className="list-decimal pl-5">
                    {actualSetlist.encore.map((song, i) => (
                      <li key={`encore-${i}`} className="mb-1 text-white">{song.name}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}