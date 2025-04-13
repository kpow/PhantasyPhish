import React, { useState, useContext, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SetlistContext } from '@/contexts/SetlistContext';
import { useScroll } from '@/contexts/ScrollContext';
import { usePhishData } from '@/hooks/usePhishData';
import { PhishSong } from '@/types';
import { Search, ChevronUp, ArrowDown, ArrowUp, SortAsc, SortDesc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SongsList() {
  const { songs, isLoadingSongs } = usePhishData();
  const { 
    setlist,
    setSetlistSpot,
    addSongToSet,
    setSetlist
  } = useContext(SetlistContext);
  const { scrollToSet } = useScroll();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<'az' | 'plays'>('plays');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);

  // Sort and filter songs
  const filteredSongs = useMemo(() => {
    if (!songs) return [];
    
    const filtered = songs.filter(song => 
      song.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Create a sorted array based on sort type and direction
    if (sortType === 'az') {
      return [...filtered].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // For plays, ascending means least to most, descending means most to least
      if (sortDirection === 'asc') {
        return [...filtered].sort((a, b) => a.times_played - b.times_played);
      } else {
        return [...filtered].sort((a, b) => b.times_played - a.times_played);
      }
    }
  }, [songs, searchTerm, sortType, sortDirection]);

  // Toggle sort type and handle sort direction
  const toggleSort = (type: 'az' | 'plays') => {
    if (sortType === type) {
      // If clicking the same sort type, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If changing sort type, set a sensible default direction:
      // For A-Z, default to ascending (A to Z)
      // For Plays, default to descending (most played first)
      setSortType(type);
      setSortDirection(type === 'az' ? 'asc' : 'desc');
    }
  };

  // Function to find the first empty spot in a set
  const findFirstEmptySpot = (setType: 'set1' | 'set2' | 'encore') => {
    const set = setlist[setType];
    for (let i = 0; i < set.length; i++) {
      if (!set[i].song) {
        return i; // Return the position of the first empty spot
      }
    }
    return -1; // Return -1 if no empty spots found
  };

  // Function to add song to a specific set
  const addSongToFirstEmptySpot = (song: PhishSong, setType: 'set1' | 'set2' | 'encore') => {
    const position = findFirstEmptySpot(setType);
    
    if (position !== -1) {
      // If there's an empty spot, use it
      setSetlistSpot(setType, position, song);
      
      // If it's in the last position, trigger scroll
      if (position === setlist[setType].length - 1) {
        // Trigger scroll to this set
        scrollToSet(setType);
      }
    } else {
      // If no empty spots and not at max capacity, add a new slot with the song
      const maxSize = setType === 'encore' ? 3 : 15;
      
      if (setlist[setType].length < maxSize) {
        // Create a deep copy of the current setlist
        const updatedSetlist = { 
          set1: [...setlist.set1],
          set2: [...setlist.set2],
          encore: [...setlist.encore]
        };
        
        // Create a new spot with the song
        const newPosition = updatedSetlist[setType].length;
        const newSpot = { position: newPosition, song };
        
        // Add the new spot with the song to the appropriate set
        updatedSetlist[setType].push(newSpot);
        
        // Update the entire setlist in one operation
        setSetlist(updatedSetlist);
        
        // Always trigger scroll when adding a new spot
        scrollToSet(setType);
      }
    }
    
    // Close the menu after adding
    setExpandedSongId(null);
  };

  // Toggle the expanded state of a song
  const toggleSongExpand = (songId: string) => {
    setExpandedSongId(expandedSongId === songId ? null : songId);
  };

  if (isLoadingSongs) {
    return null; // Loading state handled in parent
  }

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg h-full">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl text-white">songs</h2>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant={sortType === 'plays' ? 'default' : 'secondary'}
              onClick={() => toggleSort('plays')} 
              className={sortType === 'plays' ? 'bg-primary' : 'bg-gray-700'}
            >
              <span className="mr-1">Plays</span>
              {sortType === 'plays' && (
                sortDirection === 'asc' ? 
                <SortAsc className="h-3 w-3" /> : 
                <SortDesc className="h-3 w-3" />
              )}
            </Button>
            <Button 
              size="sm"
              variant={sortType === 'az' ? 'default' : 'secondary'}
              onClick={() => toggleSort('az')}
              className={sortType === 'az' ? 'bg-primary' : 'bg-gray-700'}
            >
              <span className="mr-1">A-Z</span>
              {sortType === 'az' && (
                sortDirection === 'asc' ? 
                <SortAsc className="h-3 w-3" /> : 
                <SortDesc className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Song Search */}
        <div className="mb-4">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search songs..." 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 absolute right-3 top-2.5 text-gray-400" />
          </div>
        </div>
        
        {/* Song List */}
        <ScrollArea className="h-[60vh] pr-2" type="always">
          <div className="space-y-1">
            {filteredSongs.map((song, index) => (
              <div key={song.id} className="relative">
                <div 
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    index % 2 === 0
                    ? 'bg-[rgba(30,30,30,0.8)] hover:bg-[rgba(59,130,246,0.2)]'
                    : 'bg-[rgba(40,40,40,0.8)] hover:bg-[rgba(59,130,246,0.2)]'
                  } ${expandedSongId === song.id ? 'bg-[rgba(59,130,246,0.3)]' : ''}`}
                  onClick={() => toggleSongExpand(song.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[#E5E5E5]">{song.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{song.times_played}x</span>
                      <ChevronUp 
                        className={`h-4 w-4 transition-transform text-gray-400 
                          ${expandedSongId === song.id ? 'rotate-0' : 'rotate-180'}`} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Quick Add Buttons */}
                <AnimatePresence>
                  {expandedSongId === song.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-gray-800 rounded-b-lg"
                    >
                      <div className="p-2 flex justify-center space-x-4">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="bg-blue-800 hover:bg-blue-700 text-white border-blue-700"
                          onClick={() => addSongToFirstEmptySpot(song, 'set1')}
                          disabled={setlist['set1'].length >= 15} // Only disable if at max length
                        >
                          S1
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="bg-purple-800 hover:bg-purple-700 text-white border-purple-700"
                          onClick={() => addSongToFirstEmptySpot(song, 'set2')}
                          disabled={setlist['set2'].length >= 15} // Only disable if at max length
                        >
                          S2
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="bg-red-800 hover:bg-red-700 text-white border-red-700"
                          onClick={() => addSongToFirstEmptySpot(song, 'encore')}
                          disabled={false} // Debug: Never disable the button
                        >
                          E ({setlist['encore'].length}/3)
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            
            {filteredSongs.length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No songs found matching "{searchTerm}"
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
