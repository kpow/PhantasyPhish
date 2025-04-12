import React, { useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SetlistItem, PhishSong } from '@/types';

interface SetlistSectionProps {
  title: string;
  setType: 'set1' | 'set2' | 'encore';
  setItems: SetlistItem[];
  titleColor: string;
  maxItems: number;
  height: string;
  onAddSong: (setType: 'set1' | 'set2' | 'encore') => void;
  onSetSong: (setType: 'set1' | 'set2' | 'encore', position: number, song: PhishSong | null) => void;
  selectedSong: PhishSong | null;
}

export default function SetlistSection({ 
  title, 
  setType, 
  setItems, 
  titleColor, 
  maxItems, 
  height,
  onAddSong, 
  onSetSong,
  selectedSong
}: SetlistSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll to bottom of a scroll area
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 50); // Small delay to ensure the DOM has updated
  };
  
  const renderSetlistSpot = (position: number) => {
    const currentItem = setItems[position];
    const songName = currentItem.song ? currentItem.song.name : 'Click to add a song';
    const textColor = currentItem.song ? 'text-white' : 'text-gray-500';
    
    const handleClick = () => {
      // If there's a selected song, add it here
      if (selectedSong) {
        onSetSong(setType, position, selectedSong);
      } else if (currentItem.song) {
        // If clicking on a song that's already set, remove it
        onSetSong(setType, position, null);
      }
    };
    
    return (
      <div 
        className={`flex-1 border border-gray-700 rounded-lg p-3 ${textColor} 
        ${selectedSong ? 'hover:bg-green-900/30' : 'hover:bg-[rgba(255,255,255,0.1)]'} 
        ${currentItem.song ? 'border-primary/50' : 'border-gray-700'}
        transition-colors cursor-pointer`}
        onClick={handleClick}
      >
        {songName}
      </div>
    );
  };
  
  const handleAddSong = () => {
    onAddSong(setType);
    scrollToBottom();
  };
  
  return (
    <div className="mb-6">
      <h3 className={`font-display text-xl mb-3 ${titleColor}`}>{title}</h3>
      <div className="border border-gray-800 rounded-lg overflow-hidden mb-2">
        <ScrollArea className={`${height} pr-4`} ref={scrollRef}>
          <div className="space-y-2 p-2">
            {setItems.map((_, index) => (
              <div key={`${setType}-${index}`} className="flex items-center">
                <span className={`font-display text-lg mr-3 ${titleColor} w-6 text-center`}>{index + 1}</span>
                {renderSetlistSpot(index)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      {setItems.length < maxItems && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white"
          onClick={handleAddSong}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Song
        </Button>
      )}
    </div>
  );
}