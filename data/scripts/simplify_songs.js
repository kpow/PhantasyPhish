import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the parsed songs
const parsedSongs = JSON.parse(fs.readFileSync(path.join(__dirname, 'phish_songs_parsed.json'), 'utf8'));

// Create a simplified version with just the data we need for our app
const simplifiedSongs = parsedSongs
  .filter(song => song.type === 'song') // Only include actual songs, not aliases
  .map(song => ({
    id: song.url.split('/').pop(), // Use the URL slug as the ID
    name: song.name,
    slug: song.url.split('/').pop(),
    times_played: song.timesPlayed || 0,
    url: song.url,
    original_artist: song.originalArtist
  }))
  .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

// Save to file
fs.writeFileSync(
  path.join(__dirname, 'phish_songs.json'), 
  JSON.stringify(simplifiedSongs, null, 2)
);

console.log(`Saved ${simplifiedSongs.length} songs to phish_songs.json`);