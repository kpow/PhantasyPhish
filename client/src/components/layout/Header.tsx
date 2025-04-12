import React from 'react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="mb-8">
      <nav className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#3B82F6" fill="#1E1E1E"/>
            <path d="M12 6v6l4 2" stroke="#3B82F6"/>
          </svg>
          <h1 className="font-display text-3xl md:text-4xl text-primary">Phantasy Phish</h1>
        </div>
        <div>
          <Button className="bg-primary hover:bg-blue-600 font-medium py-2 px-4 rounded-lg transition-colors">Login</Button>
        </div>
      </nav>
    </header>
  );
}
