import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-gray-800 mt-4 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">

          {/* About Column */}
          <div className="max-w-[400px] ml-8">
            <h3 className="font-display text-xl text-primary mb-4">Phantasy Phish</h3>
            <p className="text-gray-300">
              A fun side project for Phish fans to predict setlists for upcoming shows.
              No serious business here, just vibing and grooving with the band!
            </p>
          </div>
          
          
          {/* Tech Stack Column */}
          <div className="mr-6 max-w-[400px]">
            <h3 className="font-display text-xl text-primary mb-4">Tech Stack</h3>
            <p className="space-y-2 text-gray-300">
              Love using awesome technologies like{' '}
              <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors"><strong>React</strong></a>,{' '}
              <a href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors"><strong>TypeScript</strong></a>,{' '}
              <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors"><strong>Tailwind CSS</strong></a>,{' '}
              <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors"><strong>shadcn/ui</strong></a>,{' '}
              <a href="https://www.postgresql.org" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors"><strong>PostgreSQL</strong></a>,{' '}
              and the powerful <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors"><strong>Node.js</strong></a>{' '}
              to build cool stuff!
            </p>
          </div>

       
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>©</span> 

{new Date().getFullYear()} <strong>phantasy phish</strong>. made with &#10084; by <a className="font-display text-lg text-primary" href="http://kpow.xyz" target="_blank">kpow</a>.
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-gray-400 text-sm">
              not affiliated with phish. 
              <br className="md:hidden" /> data from <a href="phish.net" target="_blank">phish.net</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}