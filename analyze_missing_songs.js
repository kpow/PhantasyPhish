import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing songs from our database
const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
const dbSongs = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));

// Read the markdown data to extract song information
const markdownPath = path.join(__dirname, 'attached_assets', 'content-1744427129293.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf8');

// Regular expression to match song entries in markdown table format
const songRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| ([^|]+) \| \[(\d+)\]\([^)]+\) \| \[([^\]]+)\]\([^)]+\) \| \[([^\]]+)\]\([^)]+\) \| (\d+) \|/g;

// Array to hold all the songs from markdown
const markdownSongs = [];
let match;

while ((match = songRegex.exec(markdownContent)) !== null) {
  markdownSongs.push({
    name: match[1],
    url: match[2],
    artist: match[3].trim(),
    times_played: parseInt(match[4]),
    debut_date: match[5],
    last_played: match[6],
    gap: parseInt(match[7])
  });
}

// Remove duplicates from markdownSongs based on song name
const uniqueMarkdownSongs = {};
markdownSongs.forEach(song => {
  // If song exists and has a higher play count, update it
  if (!uniqueMarkdownSongs[song.name] || 
      uniqueMarkdownSongs[song.name].times_played < song.times_played) {
    uniqueMarkdownSongs[song.name] = song;
  }
});

// Convert to array and sort by name
const uniqueSongs = Object.values(uniqueMarkdownSongs).sort((a, b) => 
  a.name.localeCompare(b.name)
);

// Function to normalize song names for comparison
function normalizeSongName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
}

// Check which songs are missing
const dbSongNames = new Set(dbSongs.map(s => normalizeSongName(s.name)));
const missingSongs = uniqueSongs.filter(song => 
  !dbSongNames.has(normalizeSongName(song.name))
);

// Create a comprehensive report
const topMissingSongs = missingSongs
  .sort((a, b) => b.times_played - a.times_played) // Sort by most played
  .slice(0, 50); // Top 50 most played missing songs

// Generate the report
const report = {
  totalDbSongs: dbSongs.length,
  totalMarkdownSongs: Object.keys(uniqueMarkdownSongs).length,
  totalMissingSongs: missingSongs.length,
  topMissingSongs: topMissingSongs.map(song => ({
    name: song.name,
    artist: song.artist,
    times_played: song.times_played,
    last_played: song.last_played
  }))
};

// Save the report
fs.writeFileSync('missing_songs_report.json', JSON.stringify(report, null, 2));

// Display a summary
console.log(`Database songs: ${report.totalDbSongs}`);
console.log(`Markdown unique songs: ${report.totalMarkdownSongs}`);
console.log(`Missing songs identified: ${report.totalMissingSongs}`);
console.log(`Top 50 most played missing songs have been saved to missing_songs_report.json`);

// Create a CSV file with the top missing songs for easier viewing
const csvContent = ['Song Name,Artist,Times Played,Last Played'].concat(
  topMissingSongs.map(song => 
    `"${song.name}","${song.artist}",${song.times_played},"${song.last_played}"`
  )
).join('\n');

fs.writeFileSync('top_missing_songs.csv', csvContent);
console.log('CSV file with top missing songs created: top_missing_songs.csv');