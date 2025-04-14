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
  } | null;
}

export default function ScoreCard({ scoreBreakdown, actualSetlist, showDetails }: ScoreCardProps) {
  return (
    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-xl p-6 overflow-auto">
      {/* Score Summary Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display text-3xl text-white">
            Score: <span className="text-green-400 font-bold">{scoreBreakdown.totalScore}</span>
          </h2>
          {showDetails && (
            <div className="text-sm text-gray-300 mt-1">
              {showDetails.date} | {showDetails.venue}, {showDetails.location}
            </div>
          )}
        </div>
        <Badge variant="outline" className="border-green-500 text-green-500 px-3 py-1 text-sm font-semibold">TEST SCORE</Badge>
      </div>
      
      {/* Score Breakdown - Now in rows instead of columns */}
      <div className="rounded-lg bg-[#1A1A1A] p-4 mb-6">
        <h3 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wide">Score Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 rounded bg-[#252525]">
            <div className="flex items-center">
              <span className="text-white font-semibold w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 mr-3">
                {scoreBreakdown.songInShow.count}
              </span>
              <span className="text-white">Song in Show</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">3 pts each</span>
              <span className="text-green-400 font-bold">{scoreBreakdown.songInShow.points}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 rounded bg-[#252525]">
            <div className="flex items-center">
              <span className="text-white font-semibold w-8 h-8 flex items-center justify-center rounded-full bg-orange-600 mr-3">
                {scoreBreakdown.songInSet.count}
              </span>
              <span className="text-white">Song in Set</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">6 pts each</span>
              <span className="text-green-400 font-bold">{scoreBreakdown.songInSet.points}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 rounded bg-[#252525]">
            <div className="flex items-center">
              <span className="text-white font-semibold w-8 h-8 flex items-center justify-center rounded-full bg-green-600 mr-3">
                {scoreBreakdown.correctSong.count}
              </span>
              <span className="text-white">Correct Song</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">10 pts each</span>
              <span className="text-green-400 font-bold">{scoreBreakdown.correctSong.points}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 rounded bg-[#252525]">
            <div className="flex items-center">
              <span className="text-white font-semibold w-8 h-8 flex items-center justify-center rounded-full bg-purple-600 mr-3">
                {scoreBreakdown.correctSpecial.count}
              </span>
              <span className="text-white">Special Songs</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">15 pts each</span>
              <span className="text-green-400 font-bold">{scoreBreakdown.correctSpecial.points}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 rounded bg-[#252525]">
            <div className="flex items-center">
              <span className="text-white font-semibold w-8 h-8 flex items-center justify-center rounded-full bg-pink-600 mr-3">
                {scoreBreakdown.encoreInSet.count}
              </span>
              <span className="text-white">Encore</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">10 pts each</span>
              <span className="text-green-400 font-bold">{scoreBreakdown.encoreInSet.points}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns for Song Predictions and Actual Setlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detailed Song Predictions */}
        <div className="rounded-lg bg-[#1A1A1A] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold">Your Predictions</h3>
          </div>
          <ScrollArea className="h-[350px]">
            <div className="p-4">
              {scoreBreakdown.details.length > 0 ? (
                <div className="space-y-3">
                  {scoreBreakdown.details.map((detail, index) => (
                    <div key={index} className="bg-[#252525] p-3 rounded-md flex justify-between items-center">
                      <div>
                        <span className="font-medium text-white">{detail.songName}</span>
                        <div className="flex items-center mt-1">
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
                          
                          {detail.actualSet && (
                            <div className="flex items-center ml-2">
                              <span className="text-gray-400 mx-1">→</span>
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
                            </div>
                          )}
                          
                          {!detail.actualSet && (
                            <span className="ml-2 text-gray-500 text-sm">Not played</span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-1">{detail.reason}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-bold ${detail.points > 0 ? "text-green-400" : "text-gray-500"}`}>
                          {detail.points}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  No predictions to score
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Actual Setlist */}
        <div className="rounded-lg bg-[#1A1A1A] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold">Actual Setlist</h3>
          </div>
          <ScrollArea className="h-[350px]">
            <div className="p-4 space-y-4">
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
              
              {/* Show notes section */}
              <div>
                <h3 className="text-yellow-500 font-semibold mb-2">Show Notes</h3>
                <div className="bg-[#252525] p-3 rounded-md">
                  <p className="text-gray-300 text-sm italic">
                    This is a test score using a real Phish setlist from 2024. When scoring actual predictions after a show, additional details and information about the show will appear here.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}