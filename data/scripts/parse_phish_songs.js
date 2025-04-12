import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Markdown file content
const markdownContent = fs.readFileSync(path.join(__dirname, 'attached_assets/content-1744427129293.md'), 'utf8');

// Regular expression to match song entries in the table
const songRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (?:\[([^\]]*)\]\(([^)]*)\)|) \| (?:\[(\d+)\]\(([^)]*)\)|Found in Discography|Alias of \[([^\]]+)\]\(([^)]+)\)) \| (?:\[([^\]]*)\]\(([^)]*)\)|) \| (?:\[([^\]]*)\]\(([^)]*)\)|) \| (\d+|) \|/g;

const songs = [];
let match;

// Parse each song entry
while ((match = songRegex.exec(markdownContent)) !== null) {
  // Determine what kind of entry it is
  if (match[7]) {
    // This is an alias entry
    const aliasOf = {
      name: match[7],
      url: match[8]
    };
    
    songs.push({
      name: match[1],
      url: match[2],
      originalArtist: match[3] || 'Phish',
      originalArtistUrl: match[4] || '',
      type: 'alias',
      aliasOf
    });
  } else if (match[5]) {
    // Regular song with play count
    songs.push({
      name: match[1],
      url: match[2],
      originalArtist: match[3] || 'Phish',
      originalArtistUrl: match[4] || '',
      type: 'song',
      timesPlayed: parseInt(match[5], 10),
      chartUrl: match[6] || '',
      debut: match[9] || '',
      debutUrl: match[10] || '',
      lastPlayed: match[11] || '',
      lastPlayedUrl: match[12] || '',
      gap: match[13] ? parseInt(match[13], 10) : null
    });
  } else if (match[0].includes('Found in Discography')) {
    // Song from discography but not played live
    songs.push({
      name: match[1],
      url: match[2],
      originalArtist: match[3] || 'Phish',
      originalArtistUrl: match[4] || '',
      type: 'discography',
      timesPlayed: 0
    });
  }
}

// Save the parsed songs to a JSON file
fs.writeFileSync(
  path.join(__dirname, 'phish_songs_parsed.json'), 
  JSON.stringify(songs, null, 2)
);

console.log(`Successfully parsed ${songs.length} Phish songs.`);