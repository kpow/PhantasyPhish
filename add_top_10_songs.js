import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Top 10 songs data from our analysis
const top10Songs = [
  {
    name: "You Enjoy Myself",
    artist: "Phish",
    times_played: 615,
    url: "https://phish.net/song/you-enjoy-myself",
    slug: "you-enjoy-myself"
  },
  {
    name: "Possum",
    artist: "Phish",
    times_played: 568,
    url: "https://phish.net/song/possum",
    slug: "possum"
  },
  {
    name: "Mike's Song",
    artist: "Phish",
    times_played: 535,
    url: "https://phish.net/song/mikes-song",
    slug: "mikes-song"
  },
  {
    name: "Chalk Dust Torture",
    artist: "Phish",
    times_played: 513,
    url: "https://phish.net/song/chalk-dust-torture",
    slug: "chalk-dust-torture"
  },
  {
    name: "Weekapaug Groove",
    artist: "Phish",
    times_played: 509,
    url: "https://phish.net/song/weekapaug-groove",
    slug: "weekapaug-groove"
  },
  {
    name: "Bouncing Around the Room",
    artist: "Phish",
    times_played: 490,
    url: "https://phish.net/song/bouncing-around-the-room",
    slug: "bouncing-around-the-room"
  },
  {
    name: "Run Like an Antelope",
    artist: "Phish",
    times_played: 482,
    url: "https://phish.net/song/run-like-an-antelope",
    slug: "run-like-an-antelope"
  },
  {
    name: "Golgi Apparatus",
    artist: "Phish",
    times_played: 479,
    url: "https://phish.net/song/golgi-apparatus",
    slug: "golgi-apparatus"
  },
  {
    name: "Cavern",
    artist: "Phish",
    times_played: 478,
    url: "https://phish.net/song/cavern",
    slug: "cavern"
  },
  {
    name: "David Bowie",
    artist: "Phish",
    times_played: 473,
    url: "https://phish.net/song/david-bowie",
    slug: "david-bowie"
  }
];

// Read the existing songs file
const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
let songs = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));

console.log('Adding top 10 missing songs to the database...');

// Track songs added and songs that already exist
const added = [];
const existing = [];

for (const song of top10Songs) {
  // Check if song already exists (by name)
  const songExists = songs.some(s => s.name.toLowerCase() === song.name.toLowerCase());
  
  if (songExists) {
    existing.push(song.name);
    continue;
  }
  
  // Create the song object
  const newSong = {
    id: song.slug,
    name: song.name,
    slug: song.slug,
    times_played: song.times_played,
    url: song.url,
    original_artist: song.artist
  };
  
  // Add to songs array
  songs.push(newSong);
  added.push(song.name);
}

if (added.length > 0) {
  // Sort alphabetically
  songs.sort((a, b) => a.name.localeCompare(b.name));
  
  // Write the updated songs back to the file
  fs.writeFileSync(songsFilePath, JSON.stringify(songs, null, 2));
  
  console.log(`✅ Added ${added.length} new songs: ${added.join(', ')}`);
} else {
  console.log('No new songs were added.');
}

if (existing.length > 0) {
  console.log(`ℹ️ These songs already exist: ${existing.join(', ')}`);
}

// Reload songs in the database via API call
console.log('\nUpdating database with new songs...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/songs/reload',
  method: 'POST'
};

const req = https.request(options, res => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log(`API response: ${response.message}`);
      if (response.newSongs && response.newSongs.length > 0) {
        console.log(`New songs added to database: ${response.newSongs.join(', ')}`);
      }
    } catch (e) {
      console.log('Error parsing API response:', e.message);
    }
  });
});

req.on('error', error => {
  console.error('Error making API request:', error.message);
  console.log('Please manually call the reload API endpoint using:');
  console.log('curl -X POST http://localhost:5000/api/songs/reload');
});

req.end();