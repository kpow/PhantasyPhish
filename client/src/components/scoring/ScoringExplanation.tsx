import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CircleCheck,
  CircleAlert,
  Star
} from "lucide-react";

export default function ScoringExplanation() {
  return (
    <Card className="bg-[#1E1E1E] rounded-xl shadow-lg border-0 overflow-hidden mt-4">
      <CardContent className="p-2">
        <h2 className="font-display text-xl mb-3 text-white p-3">how scoring works</h2>
        
        <div className="bg-[#1A1A1A] p-4 rounded-lg">
          <div className="space-y-2">
            <div className="p-3 rounded bg-[#252525]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-purple-600 mr-3">
                    <Star size={14} />
                  </span>
                  <span className="text-white font-display">Special Songs</span>
                </div>
                <div className="flex items-center">
                  <span className="text-md font-bold text-gray-400 mr-2">15 pts</span>
                </div>
              </div>
              <div className="mt-2 pl-10">
                <p className="text-xs text-gray-400">
                  Correctly predicting the opener, closer, or an encore song in the exact position
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded bg-[#252525]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-green-600 mr-3">
                    <CircleCheck size={14} />
                  </span>
                  <span className="text-white font-display">Correct Song</span>
                </div>
                <div className="flex items-center">
                  <span className="text-md font-bold text-gray-400 mr-2">10 pts</span>
                </div>
              </div>
              <div className="mt-2 pl-10">
                <p className="text-xs text-gray-400">
                  Correctly predicting a song in the exact position in a set
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded bg-[#252525]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-pink-600 mr-3">
                    <CircleCheck size={14} />
                  </span>
                  <span className="text-white font-display">Encore</span>
                </div>
                <div className="flex items-center">
                  <span className="text-md font-bold text-gray-400 mr-2">10 pts</span>
                </div>
              </div>
              <div className="mt-2 pl-10">
                <p className="text-xs text-gray-400">
                  Predicting an encore song that appears anywhere in the encore
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded bg-[#252525]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-orange-600 mr-3">
                    <CircleAlert size={14} />
                  </span>
                  <span className="text-white font-display">Song in Set</span>
                </div>
                <div className="flex items-center">
                  <span className="text-md text-gray-400 font-bold mr-2">6 pts</span>
                </div>
              </div>
              <div className="mt-2 pl-10">
                <p className="text-xs text-gray-400">
                  Predicting a song that appears in the correct set, but not in the exact position
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded bg-[#252525]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-white font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 mr-3">
                    <CircleAlert size={14} />
                  </span>
                  <span className="text-white font-display">Song in Show</span>
                </div>
                <div className="flex items-center">
                  <span className="text-md font-bold text-gray-400 mr-2">3 pts</span>
                </div>
              </div>
              <div className="mt-2 pl-10">
                <p className="text-xs text-gray-400">
                  Predicting a song that appears anywhere in the show, but in a different set
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}