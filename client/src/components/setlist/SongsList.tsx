import React, { useState, useContext, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SetlistContext } from '@/contexts/SetlistContext';
import { usePhishData } from '@/hooks/usePhishData';
import { PhishSong } from '@/types';
import { Search } from 'lucide-react';

export default function SongsList() {
  const { songs, isLoadingSongs } = usePhishData();
  const { selectedSong, setSelectedSong } = useContext(SetlistContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<'az' | 'plays'>('az');

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
            {filteredSongs.map(song => (
              <div 
                key={song.id} 
                className={`p-2 rounded-lg flex justify-between transition-colors cursor-pointer ${
                  selectedSong?.id === song.id 
                    ? 'bg-[rgba(59,130,246,0.3)] border-l-4 border-primary'
                    : 'hover:bg-[rgba(59,130,246,0.2)]'
                }`}
                onClick={() => handleSongClick(song)}
              >
                <span className="text-[#E5E5E5]">{song.name}</span>
                <span className="text-xs text-gray-400">{song.times_played}x</span>
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
