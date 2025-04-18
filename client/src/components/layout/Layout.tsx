import React from 'react';
import Footer from './Footer';
import Header from './Header';
import ShowOverlay from '../overlay/ShowOverlay';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  return (
    <div 
      className="min-h-screen bg-dark text-white flex flex-col"
      style={{
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundColor: "#121212",
      }}
    >
      <div className="flex-grow">
        <Header />
        {children}
      </div>
      <Footer />
      
      {/* Show overlay when enabled */}
      <ShowOverlay />
    </div>
  );
}