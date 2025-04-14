import React, { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScoringBreakdown, ProcessedSetlist } from '@shared/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { SetlistContext } from '@/contexts/SetlistContext';

interface ScoreCardProps {
  scoreBreakdown: ScoringBreakdown;
  actualSetlist: ProcessedSetlist | null;
  showDetails?: {
    date: string;
    venue: string;
    location: string;
  } | null;
}

export default function ScoreCard({ scoreBreakdown, actualSetlist, showDetails }: ScoreCardProps) {
  const { toggleScoringMode } = useContext(SetlistContext);
  const [isPredictionsOpen, setIsPredictionsOpen] = useState(false);
  const [isSetlistOpen, setIsSetlistOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  if (!actualSetlist) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl shadow-lg p-5 h-full">
        <div className="text-center py-6 text-gray-400">
          No setlist data available for scoring
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] rounded-xl shadow-lg p-5 h-full overflow-y-auto">
      {/* Score Summary Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-2xl text-white">
            Score: <span className="text-green-400 font-bold">{scoreBreakdown.totalScore}</span>
          </h2>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-green-500 text-green-500 px-3 py-1 text-sm font-semibold">TEST SCORE</Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleScoringMode()}
              className="text-gray-400 hover:text-white hover:bg-[#2A2A2A]"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {showDetails && (
          <div className="text-sm text-gray-300 mt-1">
            {showDetails.date} | {showDetails.venue}, {showDetails.location}
          </div>
        )}
      </div>
      
      {/* Score Breakdown - Keep rows design */}
      <div className="bg-[#1A1A1A] p-4 mb-5 rounded-lg">
        <h3 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wide">Score Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 rounded bg-[#252525]">
            <div className="flex items-center">
              <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 mr-3">
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
              <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-orange-600 mr-3">
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
              <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-green-600 mr-3">
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
              <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-purple-600 mr-3">
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
              <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-pink-600 mr-3">
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

      {/* Your Predictions - Now collapsible */}
      <Collapsible 
        open={isPredictionsOpen} 
        onOpenChange={setIsPredictionsOpen}
        className="bg-[#1A1A1A] rounded-lg mb-5"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 cursor-pointer">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-white font-semibold">Your Predictions</h3>
            <div className="flex items-center text-gray-400">
              <Badge variant="outline" className="mr-2">
                {scoreBreakdown.details.length} songs
              </Badge>
              {isPredictionsOpen ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="p-4">
            {scoreBreakdown.details.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {scoreBreakdown.details.map((detail, index) => (
                  <div key={index} className="bg-[#252525] p-3 rounded-md flex flex-col h-full">
                    <div className="flex-1">
                      <span className="font-medium text-white block mb-2">{detail.songName}</span>
                      <div className="flex flex-wrap gap-2 mt-1 mb-2">
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
                          <>
                            <span className="text-gray-400">→</span>
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
                          </>
                        )}
                        
                        {!detail.actualSet && (
                          <span className="text-gray-500 text-sm">Not played</span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-2">{detail.reason}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">Points</span>
                      <div className={`text-lg font-bold ${detail.points > 0 ? "text-green-400" : "text-gray-500"}`}>
                        {detail.points}
                      </div>
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
        </CollapsibleContent>
      </Collapsible>
      
      {/* Actual Setlist - Now collapsible */}
      <Collapsible 
        open={isSetlistOpen} 
        onOpenChange={setIsSetlistOpen}
        className="bg-[#1A1A1A] rounded-lg mb-5"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 cursor-pointer">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-white font-semibold">Actual Setlist</h3>
            <div className="flex items-center text-gray-400">
              <Badge variant="outline" className="mr-2">
                {actualSetlist.set1.length + actualSetlist.set2.length + actualSetlist.encore.length} songs
              </Badge>
              {isSetlistOpen ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
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
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Show notes section - Now collapsible */}
      <Collapsible 
        open={isNotesOpen} 
        onOpenChange={setIsNotesOpen}
        className="bg-[#1A1A1A] rounded-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 cursor-pointer">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-white font-semibold">Show Notes</h3>
            <div className="flex items-center text-gray-400">
              {isNotesOpen ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="p-4">
            <div className="bg-[#252525] p-3 rounded-md">
              <p className="text-gray-300 text-sm italic">
                This is a test score using a real Phish setlist from 2024. When scoring actual predictions after a show, additional details and information about the show will appear here.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}