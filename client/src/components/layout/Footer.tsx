import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-gray-800 mt-12 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Links Column */}
          <div>
            <h3 className="font-display text-xl text-primary mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/kpow/phantasy-phish" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  GitHub Repo
                </a>
              </li>
              <li>
                <a 
                  href="https://kpow.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  kpow.com
                </a>
              </li>
              <li>
                <a 
                  href="https://phish.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  phish.net
                </a>
              </li>
            </ul>
          </div>
          
          {/* About Column */}
          <div>
            <h3 className="font-display text-xl text-primary mb-4">Phantasy Phish</h3>
            <p className="text-gray-300">
              A fun side project by kpow for Phish fans to predict setlists for upcoming shows.
              No serious business here, just vibing and grooving with the band!
            </p>
          </div>
          
          {/* Tech Stack Column */}
          <div>
            <h3 className="font-display text-xl text-primary mb-4">Tech Stack</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://react.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  React
                </a>
              </li>
              <li>
                <a 
                  href="https://www.typescriptlang.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  TypeScript
                </a>
              </li>
              <li>
                <a 
                  href="https://tailwindcss.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  Tailwind CSS
                </a>
              </li>
              <li>
                <a 
                  href="https://ui.shadcn.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  shadcn/ui
                </a>
              </li>
              <li>
                <a 
                  href="https://www.postgresql.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  PostgreSQL
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Phantasy Phish. Powered by Phish data and fan love.
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-gray-400 text-sm">
              Not affiliated with Phish or any related entities. 
              <br className="md:hidden" /> Just a fan project!
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}