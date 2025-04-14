import React from 'react';
import Footer from './Footer';
import Header from './Header';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Always show header, regardless of route
  const showHeader = true;
  
  return (
    <div 
      className="min-h-screen bg-dark text-white flex flex-col"
      style={{
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundColor: "#121212",
      }}
    >
      {showHeader && <Header />}
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}