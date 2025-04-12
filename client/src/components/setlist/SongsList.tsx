import React, { useState, useContext, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SetlistContext } from '@/contexts/SetlistContext';
import { usePhishData } from '@/hooks/usePhishData';
import { PhishSong } from '@/types';
import { Search, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SongsList() {
  const { songs, isLoadingSongs } = usePhishData();
  const { 
    selectedSong, 
    setSelectedSong, 
    setlist,
    setSetlistSpot 
  } = useContext(SetlistContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<'az' | 'plays'>('az');
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);

  // Sort and filter songs
  const filteredSongs = useMemo(() => {
    if (!songs) return [];
    
    const filtered = songs.filter(song => 
      song.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (sortType === 'az') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [...filtered].sort((a, b) => b.times_played - a.times_played);
    }
  }, [songs, searchTerm, sortType]);

  const handleSongClick = (song: PhishSong) => {
    setSelectedSong(song);
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
      setSetlistSpot(setType, position, song);
    }
    // Close the menu after adding
    setExpandedSongId(null);
  };

  // Toggle the expanded state of a song
  const toggleSongExpand = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation(); // Prevent triggering the row click
    setExpandedSongId(expandedSongId === songId ? null : songId);
  };

  if (isLoadingSongs) {
    return null; // Loading state handled in parent
  }

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg h-full">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl text-white">Song List</h2>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant={sortType === 'plays' ? 'default' : 'secondary'}
              onClick={() => setSortType('plays')} 
              className={sortType === 'plays' ? 'bg-primary' : 'bg-gray-700'}
            >
              Plays
            </Button>
            <Button 
              size="sm"
              variant={sortType === 'az' ? 'default' : 'secondary'}
              onClick={() => setSortType('az')}
              className={sortType === 'az' ? 'bg-primary' : 'bg-gray-700'}
            >
              A-Z
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
        <ScrollArea className="h-[69vh] pr-2" type="always">
          <div className="space-y-1">
            {filteredSongs.map((song, index) => (
              <div key={song.id} className="relative">
                <div 
                  className={`p-2 rounded-lg flex justify-between transition-colors cursor-pointer ${
                    selectedSong?.id === song.id 
                      ? 'bg-[rgba(59,130,246,0.3)] border-l-4 border-primary'
                      : index % 2 === 0
                        ? 'bg-[rgba(30,30,30,0.8)] hover:bg-[rgba(59,130,246,0.2)]'
                        : 'bg-[rgba(40,40,40,0.8)] hover:bg-[rgba(59,130,246,0.2)]'
                  }`}
                  onClick={() => handleSongClick(song)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[#E5E5E5]">{song.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{song.times_played}x</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                        onClick={(e) => toggleSongExpand(e, song.id)}
                      >
                        <ChevronUp 
                          className={`h-4 w-4 transition-transform ${
                            expandedSongId === song.id ? 'rotate-0' : 'rotate-180'
                          }`} 
                        />
                      </Button>
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
                          disabled={findFirstEmptySpot('set1') === -1}
                        >
                          S1
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="bg-purple-800 hover:bg-purple-700 text-white border-purple-700"
                          onClick={() => addSongToFirstEmptySpot(song, 'set2')}
                          disabled={findFirstEmptySpot('set2') === -1}
                        >
                          S2
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="bg-red-800 hover:bg-red-700 text-white border-red-700"
                          onClick={() => addSongToFirstEmptySpot(song, 'encore')}
                          disabled={findFirstEmptySpot('encore') === -1}
                        >
                          E
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
