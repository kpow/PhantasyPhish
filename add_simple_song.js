import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing songs file
const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
let songs = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));

// Check if Simple already exists
const songName = 'Simple';
const songExists = songs.some(song => song.name === songName);

if (songExists) {
  console.log(`${songName} song already exists in the database.`);
} else {
  // Add Simple song
  const simpleSong = {
    "id": "simple",
    "name": "Simple",
    "slug": "simple",
    "times_played": 204,
    "url": "https://phish.net/song/simple",
    "original_artist": "Phish"
  };
  
  // Add to songs array
  songs.push(simpleSong);
  
  // Sort alphabetically
  songs.sort((a, b) => a.name.localeCompare(b.name));
  
  // Write the updated songs back to the file
  fs.writeFileSync(songsFilePath, JSON.stringify(songs, null, 2));
  
  console.log(`${songName} song has been added to the database.`);
}

console.log('Script completed. Check the database to verify the song was added.');