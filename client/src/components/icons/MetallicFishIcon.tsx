import React from 'react';
import FishIcon from './FishIcon';

interface MetallicFishIconProps {
  className?: string;
}

const MetallicFishIcon: React.FC<MetallicFishIconProps> = ({ className = "" }) => {
  return (
    <div className={`${className} relative group`}>
      {/* Base fish icon */}
      <FishIcon className="absolute inset-0 w-full h-full text-primary z-10" />
      
      {/* Metallic overlay effect - animating gradient */}
      <div 
        className="absolute inset-0 w-full h-full z-20 opacity-0 group-hover:opacity-70 transition-opacity duration-300"
        style={{
          background: `linear-gradient(
            135deg, 
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(120, 120, 120, 0.1) 25%,
            rgba(255, 255, 255, 0.6) 50%, 
            rgba(120, 120, 120, 0.1) 75%,
            rgba(255, 255, 255, 0.4) 100%
          )`,
          backgroundSize: '400% 400%',
          animation: 'metallicShimmer 3s ease infinite',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Add a subtle chrome-like highlight */}
      <div 
        className="absolute inset-0 w-full h-full z-30 opacity-0 group-hover:opacity-80 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* CSS animation for the metallic effect */}
      <style jsx>{`
        @keyframes metallicShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default MetallicFishIcon;

export default MetallicFishIcon;