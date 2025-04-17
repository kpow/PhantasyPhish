/**
 * Song Routes Module
 * 
 * This module contains all routes related to Phish songs, including retrieving song listings,
 * loading songs from cached data files, and reloading/updating the song database.
 */
import express from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { insertSongSchema } from "@shared/schema";

const router = express.Router();

/**
 * GET /api/songs
 * 
 * Retrieve a list of all songs from the database.
 * This endpoint provides a simple way to get all songs without additional processing.
 */
router.get("/songs", async (_req, res) => {
  try {
    const songs = await storage.getAllSongs();
    res.json({ songs });
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/songs/all
 * 
 * Retrieve all songs with smart fallback to local data file.
 * This endpoint first attempts to get songs from the database.
 * If the database is empty, it loads songs from a cached JSON file
 * and populates the database before returning the results.
 */
router.get("/songs/all", async (_req, res) => {
  try {
    // Try to get from storage first
    let songs = await storage.getAllSongs();
    
    // Local file path for cached songs data
    const songsFilePath = path.join(process.cwd(), 'data', 'phish_songs.json');
    
    // If no songs in storage, load from local file
    if (songs.length === 0) {
      console.log("No songs in storage, checking for cached songs data...");
      
      // Check if local file exists
      if (fs.existsSync(songsFilePath)) {
        console.log("Loading songs from cached file...");
        try {
          // Read from the file
          const fileData = fs.readFileSync(songsFilePath, 'utf8');
          const songsList = JSON.parse(fileData);
          
          console.log(`Loaded ${songsList.length} songs from cached file`);
          
          // Save each song to the database
          for (const song of songsList) {
            await storage.createSong({
              name: song.name,
              slug: song.slug,
              times_played: song.times_played
            });
          }
          
          // Fetch the newly populated songs from storage
          songs = await storage.getAllSongs();
        } catch (err) {
          console.error("Error reading songs from cached file:", err);
          res.status(500).json({ message: "Error loading song data" });
          return;
        }
      } else {
        console.error("No songs file found at:", songsFilePath);
        res.status(500).json({ message: "Song data file not found" });
        return;
      }
    }
    
    res.json({ songs });
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * POST /api/songs/reload
 * 
 * Reload songs from the JSON file, adding only new songs to the database.
 * This is useful when new songs are added to the JSON file and we want to
 * update the database without duplicating existing entries.
 */
router.post("/songs/reload", async (_req, res) => {
  try {
    // Path to the cached songs data file
    const songsFilePath = path.join(process.cwd(), 'data', 'phish_songs.json');
    
    // Check if local file exists
    if (fs.existsSync(songsFilePath)) {
      console.log("Loading songs from cached file...");
      try {
        // Read all songs from the file
        const fileData = fs.readFileSync(songsFilePath, 'utf8');
        const songsList = JSON.parse(fileData);
        
        console.log(`Found ${songsList.length} songs in file, checking for new songs...`);
        
        // Get existing songs to avoid duplicates
        const existingSongs = await storage.getAllSongs();
        const existingSongNames = new Set(existingSongs.map(song => song.name));
        
        // Filter to find only new songs that don't exist in the database
        const newSongs = songsList.filter((song: {name: string, slug: string, times_played: number}) => !existingSongNames.has(song.name));
        
        // If no new songs found, return early
        if (newSongs.length === 0) {
          return res.json({ message: "No new songs found to add", songsAdded: 0 });
        }
        
        // Save each new song to the database
        for (const song of newSongs) {
          await storage.createSong({
            name: song.name,
            slug: song.slug,
            times_played: song.times_played
          });
          console.log(`Added new song: ${song.name}`);
        }
        
        // Return success response with details
        return res.json({ 
          message: `Successfully added ${newSongs.length} new song(s)`, 
          songsAdded: newSongs.length,
          newSongs: newSongs.map((s: {name: string}) => s.name)
        });
      } catch (err) {
        console.error("Error reading songs from cached file:", err);
        res.status(500).json({ message: "Error loading song data" });
        return;
      }
    } else {
      console.error("No songs file found at:", songsFilePath);
      res.status(500).json({ message: "Song data file not found" });
      return;
    }
  } catch (error) {
    console.error("Error reloading songs:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;