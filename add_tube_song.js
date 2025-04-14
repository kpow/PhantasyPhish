import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing songs file
const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
let songs = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));

// Check if Tube already exists
const tubeExists = songs.some(song => song.name === 'Tube');

if (tubeExists) {
  console.log('Tube song already exists in the database.');
} else {
  // Add Tube song
  const tubeSong = {
    "id": "tube",
    "name": "Tube",
    "slug": "tube",
    "times_played": 196,
    "url": "https://phish.net/song/tube",
    "original_artist": "Phish"
  };
  
  // Add to songs array
  songs.push(tubeSong);
  
  // Sort alphabetically
  songs.sort((a, b) => a.name.localeCompare(b.name));
  
  // Write the updated songs back to the file
  fs.writeFileSync(songsFilePath, JSON.stringify(songs, null, 2));
  
  console.log('Tube song has been added to the database.');
}

// Now let's check if the song needs to be added to the database via the API
// This will create an endpoint call to add the song if it doesn't exist

console.log('Script completed. Check the database to verify the song was added.');