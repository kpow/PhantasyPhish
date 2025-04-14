import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to slugify song names
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Function to read the missing songs report
function readMissingSongsReport() {
  try {
    const reportPath = path.join(__dirname, 'missing_songs_report.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    return reportData.topMissingSongs || [];
  } catch (error) {
    console.error('Error reading missing songs report:', error.message);
    console.log('Please run the song analysis script first to generate missing_songs_report.json');
    return [];
  }
}

// Function to get songs already in the database
function getSongsInDatabase() {
  const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
  return JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));
}

// Function to add songs to the JSON file
function addSongsToJsonFile(songsToAdd) {
  const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
  let songs = getSongsInDatabase();
  
  const added = [];
  const existing = [];
  
  for (const song of songsToAdd) {
    // Check if song already exists (by name)
    const songExists = songs.some(s => 
      s.name.toLowerCase() === song.name.toLowerCase()
    );
    
    if (songExists) {
      existing.push(song.name);
      continue;
    }
    
    // Create a slug if not provided
    const slug = song.slug || slugify(song.name);
    
    // Create the song object
    const newSong = {
      id: slug,
      name: song.name,
      slug: slug,
      times_played: song.times_played,
      url: song.url || `https://phish.net/song/${slug}`,
      original_artist: song.artist || "Phish"
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
  }
  
  return { added, existing };
}

// Function to reload songs in the database via API call
function reloadSongsInDatabase() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/songs/reload',
      method: 'POST'
    };
    
    const req = http.request(options, res => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Error parsing API response: ' + e.message));
        }
      });
    });
    
    req.on('error', error => {
      reject(new Error('Error making API request: ' + error.message));
    });
    
    req.end();
  });
}

// Main function to process songs in batches
async function processSongBatches(batchSize = 10, startIndex = 0) {
  const allMissingSongs = readMissingSongsReport();
  
  if (allMissingSongs.length === 0) {
    console.log('No missing songs found to process.');
    return;
  }
  
  // Skip songs that were processed in previous batches
  const remainingSongs = allMissingSongs.slice(startIndex);
  
  if (remainingSongs.length === 0) {
    console.log('No more songs to process. All songs have been added.');
    return;
  }
  
  // Get the current batch of songs
  const currentBatch = remainingSongs.slice(0, batchSize);
  
  console.log(`\nProcessing batch of ${currentBatch.length} songs (starting at index ${startIndex})...`);
  console.log('Songs in this batch:');
  currentBatch.forEach((song, index) => {
    console.log(`${index + 1}. ${song.name} (${song.times_played} plays)`);
  });
  
  // Add the songs to the JSON file
  const { added, existing } = addSongsToJsonFile(currentBatch);
  
  if (added.length > 0) {
    console.log(`\n✅ Added ${added.length} new songs to JSON file: ${added.join(', ')}`);
    
    // Reload songs in the database
    try {
      console.log('\nUpdating database with new songs...');
      const apiResponse = await reloadSongsInDatabase();
      console.log(`API response: ${apiResponse.message}`);
      
      if (apiResponse.newSongs && apiResponse.newSongs.length > 0) {
        console.log(`New songs added to database: ${apiResponse.newSongs.join(', ')}`);
      }
    } catch (error) {
      console.error(error.message);
      console.log('Please manually call the reload API endpoint using:');
      console.log('curl -X POST http://localhost:5000/api/songs/reload');
    }
  } else {
    console.log('No new songs were added in this batch.');
  }
  
  if (existing.length > 0) {
    console.log(`\nℹ️ These songs already exist: ${existing.join(', ')}`);
  }
  
  // Calculate progress
  const nextIndex = startIndex + batchSize;
  const totalSongs = allMissingSongs.length;
  const processedSongs = Math.min(nextIndex, totalSongs);
  const progressPercent = (processedSongs / totalSongs * 100).toFixed(1);
  
  console.log(`\nProgress: ${processedSongs}/${totalSongs} songs processed (${progressPercent}%)`);
  
  // Check if there are more songs to process
  if (nextIndex < totalSongs) {
    console.log(`\nNext batch will start at index ${nextIndex}`);
    console.log('To process the next batch, run:');
    console.log(`node add_songs_batch.js ${batchSize} ${nextIndex}`);
  } else {
    console.log('\nAll songs have been processed! 🎉');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args[0]) || 10;
const startIndex = parseInt(args[1]) || 0;

// Run the script
processSongBatches(batchSize, startIndex);