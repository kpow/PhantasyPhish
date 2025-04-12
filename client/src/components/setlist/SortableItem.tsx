import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PhishSong } from '@/types';

interface SortableItemProps {
  id: string;
  index: number;
  handleClick: () => void;
  songName: string;
  textColor: string;
  hasSong: boolean;
  selectedSong: PhishSong | null;
  titleColor: string;
}

export function SortableItem({
  id,
  index,
  handleClick,
  songName,
  textColor,
  hasSong,
  selectedSong,
  titleColor
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center mb-2">
      <span className={`font-display text-lg mr-3 ${titleColor} w-6 text-center`}>{index + 1}</span>
      <div 
        className={`flex-1 border border-gray-700 rounded-lg p-3 ${textColor} 
          ${selectedSong ? 'hover:bg-green-900/30' : 'hover:bg-[rgba(255,255,255,0.1)]'} 
          ${hasSong ? 'border-primary/50' : 'border-gray-700'}
          transition-colors cursor-pointer flex items-center`}
        onClick={handleClick}
        {...attributes}
        {...listeners}
      >
        <div className="flex-1">{songName}</div>
        {hasSong && (
          <div className="w-6 h-6 ml-2 cursor-grab flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}