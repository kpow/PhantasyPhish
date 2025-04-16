
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CircleCheck,
  CircleAlert,
  Star
} from "lucide-react";
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ScoringExplanation() {
  const isMobile = useIsMobile();

  const scoringItems = [
    {
      icon: <Star size={14} />,
      bgColor: "bg-purple-600",
      title: "Special Songs",
      points: "15 pts",
      description: "Correctly predicting the opener, closer, or an encore song in the exact position"
    },
    {
      icon: <CircleCheck size={14} />,
      bgColor: "bg-green-600",
      title: "Correct Song",
      points: "10 pts",
      description: "Correctly predicting a song in the exact position in a set"
    },
    {
      icon: <CircleCheck size={14} />,
      bgColor: "bg-pink-600",
      title: "Encore",
      points: "10 pts",
      description: "Predicting an encore song that appears anywhere in the encore"
    },
    {
      icon: <CircleAlert size={14} />,
      bgColor: "bg-orange-600",
      title: "Song in Set",
      points: "6 pts",
      description: "Predicting a song that appears in the correct set, but not in the exact position"
    },
    {
      icon: <CircleAlert size={14} />,
      bgColor: "bg-blue-600",
      title: "Song in Show",
      points: "3 pts",
      description: "Predicting a song that appears anywhere in the show, but in a different set"
    }
  ];

  const ScoringItem = ({ item }) => (
    <div className="p-3 rounded bg-[#252525]">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className={`text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full ${item.bgColor} mr-3`}>
            {item.icon}
          </span>
          <span className="text-white font-display">{item.title}</span>
        </div>
        <div className="flex items-center">
          <span className="text-md font-bold text-gray-400 mr-2">{item.points}</span>
        </div>
      </div>
      <div className="mt-2 pl-10">
        <p className="text-xs text-gray-400">
          {item.description}
        </p>
      </div>
    </div>
  );

  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden mt-4">
      <CardContent className="p-2">
        <h2 className="font-display text-xl mb-3 text-white p-3">how scoring works</h2>
        
        <div className="bg-[#1A1A1A] p-4 rounded-lg">
          {isMobile ? (
            <div className="relative px-4">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true
                  })
                ]}
                className="w-full"
              >
                <CarouselContent>
                  {scoringItems.map((item, index) => (
                    <CarouselItem key={index} className="basis-full">
                      <ScoringItem item={item} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1 py-2">
                  <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
                  <CarouselNext className="relative right-0 top-0 translate-y-0 h-8 w-8 rounded-full bg-gray-800 border-gray-700" />
                </div>
              </Carousel>
            </div>
          ) : (
            <div className="space-y-2">
              {scoringItems.map((item, index) => (
                <ScoringItem key={index} item={item} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
