import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SetlistItem, PhishSong } from "@/types";
import { SortableItem } from "./SortableItem";
import { useScroll } from "@/contexts/ScrollContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface SetlistSectionProps {
  title: string;
  setType: "set1" | "set2" | "encore";
  setItems: SetlistItem[];
  titleColor: string;
  borderColor: string;
  height: string;
  onSetSong: (
    setType: "set1" | "set2" | "encore",
    position: number,
    song: PhishSong | null,
  ) => void;
  selectedSong: PhishSong | null;
  onReorderSongs: (
    setType: "set1" | "set2" | "encore",
    oldIndex: number,
    newIndex: number,
  ) => void;
}

export default function SetlistSection({
  title,
  setType,
  setItems,
  titleColor,
  borderColor,
  height,
  onSetSong,
  selectedSong,
  onReorderSongs,
}: SetlistSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { triggerScroll, resetTrigger } = useScroll();

  // Listen for scroll triggers
  useEffect(() => {
    if (triggerScroll[setType]) {
      scrollToBottom();
      resetTrigger(setType);
    }
  }, [triggerScroll, setType, resetTrigger]);

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px - helps distinguish from clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Function to scroll to bottom of a scroll area
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector(
          "[data-radix-scroll-area-viewport]",
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 50); // Small delay to ensure the DOM has updated
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split("-")[1]);
      const newIndex = parseInt(over.id.toString().split("-")[1]);

      onReorderSongs(setType, oldIndex, newIndex);
    }
  };

  const getItemIds = () => {
    return setItems.map((_, index) => `${setType}-${index}`);
  };

  const handleSongClick = (position: number) => {
    // With the quick add menu, we now only allow removing songs by clicking on them
    const currentItem = setItems[position];
    if (currentItem.song) {
      // If clicking on a song that's already set, remove it
      onSetSong(setType, position, null);
    }
  };

  return (
    <div className="mb-6">
      <h3 className={`font-display text-xl mb-3 ${titleColor}`}>{title}</h3>
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        {/* <ScrollArea className={`${height} pr-2`} ref={scrollRef}> */}
        <div className="p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={getItemIds()}
              strategy={verticalListSortingStrategy}
            >
              {setItems.map((item, index) => {
                const songName = item.song ? item.song.name : "?";
                const textColor = item.song ? "text-white" : "text-gray-500";

                return (
                  <SortableItem
                    key={`${setType}-${index}`}
                    id={`${setType}-${index}`}
                    index={index}
                    handleClick={() => handleSongClick(index)}
                    songName={songName}
                    textColor={textColor}
                    hasSong={!!item.song}
                    selectedSong={selectedSong}
                    titleColor={titleColor}
                    borderColor={borderColor}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
        {/* </ScrollArea> */}
      </div>
    </div>
  );
}
