# Batch Adding Songs to the Database

This document explains how to add multiple Phish songs to the database in batches.

## Overview

The application maintains a database of Phish songs for setlist prediction purposes. When songs are missing, they need to be added to make predictions more accurate. This process automates the addition of multiple songs at once.

## Available Scripts

### 1. Add Top 10 Most-Played Missing Songs

The `add_top_10_songs.js` script adds the 10 most frequently played Phish songs that are missing from our database.

```bash
node add_top_10_songs.js
```

This script:
- Adds the top 10 missing songs to the JSON data file
- Calls the API to update the database
- Reports which songs were added and which already existed

### 2. Add Missing Songs in Batches

The `add_songs_batch.js` script adds songs in batches of any size (default is 10).

```bash
# Process 10 songs starting from the beginning
node add_songs_batch.js

# Process a custom batch size
node add_songs_batch.js 5

# Continue from a specific index (to resume after previous batches)
node add_songs_batch.js 10 20
```

Parameters:
- First parameter: Batch size (default: 10)
- Second parameter: Starting index (default: 0)

This script:
- Processes songs from the missing_songs_report.json file
- Adds the specified batch of songs to the JSON data file
- Calls the API to update the database
- Reports progress and provides the command to run for the next batch

## Prerequisites

Before running these scripts, you should analyze which songs are missing:

```bash
node analyze_missing_songs.js
```

This generates:
- missing_songs_report.json: Contains detailed information about missing songs
- top_missing_songs.csv: A CSV file for easier viewing of the top missing songs

## Example Workflow

1. Run the analysis to identify missing songs:
   ```bash
   node analyze_missing_songs.js
   ```

2. Add the top 10 most-played missing songs:
   ```bash
   node add_top_10_songs.js
   ```

3. Continue adding songs in batches of 10:
   ```bash
   # First batch (songs 11-20)
   node add_songs_batch.js 10 10
   
   # Second batch (songs 21-30)
   node add_songs_batch.js 10 20
   
   # Continue until all songs are added
   ```

## Notes

- The scripts check for duplicates to avoid adding songs that already exist
- The database is updated by calling the `/api/songs/reload` endpoint
- If the API call fails, you'll need to manually call the endpoint:
  ```bash
  curl -X POST http://localhost:5000/api/songs/reload
  ```
- Progress is reported after each batch, showing how many songs have been processed