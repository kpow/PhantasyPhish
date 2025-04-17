import { useState, useEffect, useRef } from 'react';
import MetallicPaint from "../../blocks/Animations/MetallicPaint/MetallicPaint";
import FishIcon from './FishIcon';

// Defined constants for the metallic effect
const METALLIC_PARAMS = {
  edge: 2, 
  patternBlur: 0.005, 
  patternScale: 2, 
  refraction: 0.015, 
  speed: 0.3, 
  liquid: 0.07 
};

interface MetallicFishIconProps {
  className?: string;
}

export const MetallicFishIcon: React.FC<MetallicFishIconProps> = ({ className = "" }) => {
  // We'll create a mock imageData to make the metallic paint effect work
  // This is a simplified approach from the example
  const getImageData = (): ImageData => {
    // Create a small image data for the metallic effect
    // This creates a 100x100 ImageData with a simple gradient pattern
    const w = 100, h = 100;
    const imageData = new ImageData(w, h);
    
    // Fill with a simple pattern - grayscale gradient
    for(let y = 0; y < h; y++) {
      for(let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        // Create a radial gradient pattern from center
        const distToCenter = Math.sqrt(Math.pow(x - w/2, 2) + Math.pow(y - h/2, 2));
        const normDist = Math.min(1, distToCenter / (w/2));
        
        // Value between 0-255 based on distance from center
        const val = Math.floor(255 * (1 - normDist));
        
        // RGBA values
        imageData.data[idx] = val;      // R
        imageData.data[idx + 1] = val;  // G
        imageData.data[idx + 2] = val;  // B
        imageData.data[idx + 3] = 255;  // A (fully opaque)
      }
    }
    
    return imageData;
  };

  return (
    <div className={`${className} overflow-hidden relative`}>
      {/* Regular Fish icon as fallback/base */}
      <FishIcon className="absolute top-0 left-0 w-full h-full" />
      
      {/* Metallic Paint overlay */}
      <div className="absolute top-0 left-0 w-full h-full z-10 opacity-70">
        <MetallicPaint 
          imageData={getImageData()} 
          params={METALLIC_PARAMS} 
        />
      </div>
    </div>
  );
}

export default MetallicFishIcon;