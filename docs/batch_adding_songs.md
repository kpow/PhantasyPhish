# Batch Adding Songs to the Database

This document explains how to use the batch song management tools to efficiently add multiple missing songs to the database.

## Overview

The application requires a comprehensive database of Phish songs for accurate setlist predictions. We've created tools to identify missing songs and add them in batches, making it easy to maintain a complete song database.

## Available Tools

All tools are located in the `tools/song_management` directory:

1. **analyze_all_missing_songs.js** - Identifies missing songs by comparing our database with the Phish.net song data
2. **add_all_missing_songs_batch.js** - Adds missing songs in configurable batches
3. **add_songs_batch.js** - Alternative batch script for adding specific sets of songs

## Step 1: Analyze Missing Songs

First, run the analysis script to generate a report of all missing songs:

```bash
node --experimental-modules tools/song_management/analyze_all_missing_songs.js
```

This script will:
- Load the Phish.net song data from the markdown file in `attached_assets/`
- Compare it with songs in our database
- Create a JSON file with all missing songs sorted by play count
- Generate a summary report showing the most-played missing songs
- Show statistics about missing songs (total count, plays, etc.)

## Step 2: Add Songs in Batches

Use the batch script to add missing songs 10 at a time (or any batch size you prefer):

```bash
# Add first batch (songs 0-9)
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 0

# After the first batch completes, run the next batch (songs 10-19)
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 10

# Continue with subsequent batches
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 20
```

### Parameters:

1. **Batch size** (default: 10) - How many songs to process in one go
2. **Starting index** (default: 0) - Index from which to start processing songs

### What the Script Does:

- Reads the songs to add from the missing songs report
- Adds them to the phish_songs.json file
- Makes API calls to update the database
- Shows progress (percentage of songs processed)
- Provides the next command to run for the next batch

## Step 3: Verify the Additions

After running the batch scripts, you can verify the songs were added by:

1. Checking the API response which lists all newly added songs
2. Querying the songs API:

```bash
curl http://localhost:5000/api/songs/all | grep -i "SongName"
```

## Handling Errors

If any errors occur during batch processing:

1. Check the error message in the console
2. Fix the issue (e.g., correct malformed data in the source file)
3. Re-run the batch from the failed index

## Best Practices

- Run the analysis script periodically to catch any new missing songs
- Process songs in reasonable batch sizes (10-20 at a time) to avoid overwhelming the server
- Keep a backup of the song data before making large batch changes
- After completing all batches, run the analysis script again to verify no songs are still missing

## Example Workflow

```bash
# 1. Analyze to find missing songs
node --experimental-modules tools/song_management/analyze_all_missing_songs.js

# 2. Add songs in batches of 10
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 0
node --experimental-modules tools/song_management/add_all_missing_songs_batch.js 10 10
# Continue until all songs are added...

# 3. Verify no songs are missing
node --experimental-modules tools/song_management/analyze_all_missing_songs.js
```

If done correctly, the final analysis should show zero missing songs.