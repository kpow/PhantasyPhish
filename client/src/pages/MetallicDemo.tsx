import MetallicPaint, { parseLogoImage } from "../blocks/Animations/MetallicPaint/MetallicPaint";
import { useState, useEffect } from 'react';
import { useLocation } from "wouter";

// Create a simple black SVG to use with the metallic effect
const blackSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g fill="#000000" stroke="none">
    <circle cx="512" cy="512" r="256" />
  </g>
</svg>
`;

export default function MetallicDemo() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function loadDefaultImage() {
      try {
        // Create a Blob with the SVG content
        const blob = new Blob([blackSvgContent], { type: 'image/svg+xml' });
        
        // Create a File object from the blob
        const file = new File([blob], 'default.svg', { type: 'image/svg+xml' });

        const parsedData = await parseLogoImage(file);
        setImageData(parsedData?.imageData ?? null);

      } catch (err) {
        console.error("Error loading default image:", err);
      }
    }

    loadDefaultImage();
  }, []);

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-4">
        <button 
          onClick={handleBack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Back to Home
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Metallic Paint Demo</h1>
      
      <div className="w-full max-w-md mx-auto aspect-square border rounded-md overflow-hidden">
        {imageData ? (
          <MetallicPaint 
            imageData={imageData} 
            params={{ 
              edge: 2, 
              patternBlur: 0.005, 
              patternScale: 2, 
              refraction: 0.015, 
              speed: 0.3, 
              liquid: 0.07 
            }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}