# Adding Missing Songs to Phish Setlist Predictor

This document outlines the step-by-step process for adding missing Phish songs to the application's database. Follow these instructions whenever you need to add a song that's missing from the current catalog.

## Prerequisites

- Access to the project source code
- Basic knowledge of JSON and JavaScript
- Access to the Phish.net song catalog data (either via API or a markdown file)

## Process Overview

1. Identify the missing song
2. Find the song details from an authoritative source
3. Add the song to the JSON data file
4. Update the database with the new song

## Detailed Steps

### 1. Identify the Missing Song

First, check if the song is actually missing by searching in the existing database:

```bash
# Check if a song exists in the JSON file
grep -i "\"name\": \"SongName\"" data/phish_songs.json

# Check if a song exists in the parsed JSON file
grep -i "\"name\": \"SongName\"" data/phish_songs_parsed.json
```

### 2. Find the Song Details

Locate the song information from an authoritative source like Phish.net. You need the following details:
- Song name (exact spelling and capitalization)
- Song URL/slug
- Times played
- Original artist (if not Phish)

The song information can be found in the Phish.net Markdown data file, which should be available in the `attached_assets` directory.

```bash
# Search for the song in the markdown file
grep -n "SongName" attached_assets/content-*.md
```

The song entry in the markdown should look like:
```
| [Tube](https://phish.net/song/tube) | Phish | [196](https://phish.net/song/tube/chart) | [1990-09-13](https://phish.net/setlists/?showdate=1990-09-13) | [2025-01-31](https://phish.net/setlists/?showdate=2025-01-31) | 1 |
```

### 3. Add the Song to the JSON Data File

The song data is stored in `data/phish_songs.json`. You can add the song manually or create a script to insert it.

#### Option A: Manual Addition

1. Open `data/phish_songs.json`
2. Add a new entry in the format:
   ```json
   {
     "id": "tube",
     "name": "Tube",
     "slug": "tube",
     "times_played": 196,
     "url": "https://phish.net/song/tube",
     "original_artist": "Phish"
   }
   ```
3. Save the file

#### Option B: Using a Script (Recommended)

Create a script like `add_song.js`:

```javascript
// Example script for adding a song to the JSON file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing songs file
const songsFilePath = path.join(__dirname, 'data', 'phish_songs.json');
let songs = JSON.parse(fs.readFileSync(songsFilePath, 'utf8'));

// Check if the song already exists
const songName = 'Tube';
const songExists = songs.some(song => song.name === songName);

if (songExists) {
  console.log(`${songName} song already exists in the database.`);
} else {
  // Add the new song
  const newSong = {
    "id": "tube",
    "name": "Tube",
    "slug": "tube",
    "times_played": 196,
    "url": "https://phish.net/song/tube",
    "original_artist": "Phish"
  };
  
  // Add to songs array
  songs.push(newSong);
  
  // Sort alphabetically
  songs.sort((a, b) => a.name.localeCompare(b.name));
  
  // Write the updated songs back to the file
  fs.writeFileSync(songsFilePath, JSON.stringify(songs, null, 2));
  
  console.log(`${songName} song has been added to the database.`);
}
```

Run the script with:
```bash
node --experimental-modules add_song.js
```

### 4. Update the Database with the New Song

After adding the song to the JSON file, you need to update the database by calling the `/api/songs/reload` endpoint:

```bash
curl -X POST http://localhost:5000/api/songs/reload
```

The endpoint will check for new songs in the JSON file that aren't in the database and add them. You should see a response similar to:

```json
{
  "message": "Successfully added 1 new song(s)",
  "songsAdded": 1,
  "newSongs": ["Tube"]
}
```

## Verifying the Addition

You can verify the song was added by:

1. Checking the API response from the reload endpoint
2. Querying all songs and searching for your addition:
   ```bash
   curl http://localhost:5000/api/songs/all | grep -i "Tube"
   ```
3. Making a prediction that includes the new song and checking if it's recognized correctly

## Troubleshooting

If the song isn't added correctly:

1. Check your JSON syntax to make sure it's valid
2. Ensure the song name is correctly capitalized and formatted
3. Verify the `/api/songs/reload` endpoint is functioning correctly
4. Check the server logs for any errors during the process

## Maintenance Considerations

- Consider periodic updates to the entire song database to ensure it stays current with the latest Phish performances
- If adding multiple songs, consider batching them to minimize database operations

## Bulk Song Management

For managing multiple songs at once, we've created specialized tools in the `tools/song_management` directory:

### 1. Analyzing Missing Songs

To identify all missing songs:

```bash
node --experimental-modules tools/song_management/analyze_all_missing_songs.js
```

This script:
- Compares songs in our database with those from Phish.net
- Creates a JSON file with all missing songs sorted by play count
- Shows summary statistics about missing songs

### 2. Adding Songs in Batches

To add missing songs in batches of 10:

```bash
# Add first batch (songs 0-9)
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 0

# Add second batch (songs 10-19) 
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 10

# Continue with additional batches
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 20
```

Parameters:
- First parameter: Batch size (default: 10)
- Second parameter: Starting index (default: 0)

The script will:
- Process songs from the missing songs report
- Add them to the JSON file
- Call the API to update the database
- Show progress and provide the command to run for the next batch

## Note on JSON Format

The song entry in `phish_songs.json` follows this format:
```json
{
  "id": "song-slug",        // URL slug from phish.net
  "name": "Song Name",      // Exact song name with proper capitalization
  "slug": "song-slug",      // URL slug again (same as id)
  "times_played": 123,      // Number of times played
  "url": "https://phish.net/song/song-slug", // Full URL to the song page
  "original_artist": "Artist Name" // Original artist (omit if Phish)
}
```