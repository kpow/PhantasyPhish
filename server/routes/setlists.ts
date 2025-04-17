/**
 * Setlist Routes Module
 * 
 * This module handles routes related to Phish setlists, including retrieving
 * formatted setlists for display and structured setlists for prediction scoring.
 * 
 * Setlist data is sourced from the Phish.net API and processed into various formats
 * depending on the intended use (display vs. scoring).
 */
import express from "express";
import { fetchPhishData } from "../utils/api-utils";
import { z } from "zod";
import { processRawSetlist } from "../utils/scoring-utils";

const router = express.Router();

/**
 * GET /api/setlists/:showId
 * 
 * Retrieve a human-readable setlist for a specific show.
 * 
 * This endpoint:
 * 1. Fetches raw setlist data from the Phish.net API
 * 2. Groups songs by their set (Set 1, Set 2, Encore)
 * 3. Formats each set into a readable string with transitions
 * 4. Returns the formatted setlist along with show metadata
 * 
 * @param showId - The unique identifier for the show
 */
router.get("/setlists/:showId", async (req, res) => {
  try {
    const { showId } = req.params;
    
    // Fetch setlist data from the Phish.net API
    const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
      username: "phishnet" // Use phishnet username for consistent formatting
    });

    // Process the setlist data if it exists
    if (Array.isArray(setlistData) && setlistData.length > 0) {
      // Group songs by their set (1, 2, e for encore)
      const setGroups = setlistData.reduce((acc: any, song: any) => {
        if (!acc[song.set]) {
          acc[song.set] = [];
        }
        
        // Store song details for this set
        acc[song.set].push({
          name: song.song,
          transition: song.trans_mark, // Transition marks like ">"
          position: song.position,     // Song position within the set
          jamchart: song.isjamchart ? song.jamchart_description : null,
        });
        
        return acc;
      }, {});

      // Format a set's songs into a readable string
      const formatSet = (songs: any[]) => {
        return songs
          // Ensure songs are in correct order
          .sort((a, b) => a.position - b.position)
          // Combine song name with transition mark
          .map((song) => song.name + song.transition)
          // Join with spaces
          .join(" ")
          .trim();
      };

      // Build the complete setlist text
      let setlistText = "";
      
      // Add Set 1 if it exists
      if (setGroups["1"]) {
        setlistText += "Set 1: " + formatSet(setGroups["1"]) + "\n\n";
      }
      
      // Add Set 2 if it exists
      if (setGroups["2"]) {
        setlistText += "Set 2: " + formatSet(setGroups["2"]) + "\n\n";
      }
      
      // Add Encore if it exists
      if (setGroups["e"]) {
        setlistText += "Encore: " + formatSet(setGroups["e"]) + "\n\n";
      }

      // Extract show metadata from the first song in the setlist
      const firstSong = setlistData[0];
      
      // Return formatted response with setlist and show details
      res.json({
        showdate: firstSong.showdate,
        venue: firstSong.venue,
        location: `${firstSong.city}, ${firstSong.state}`,
        setlistdata: setlistText,
        // Remove HTML tags from setlist notes
        setlistnotes: firstSong.setlistnotes?.replace(/<\/?[^>]+(>|$)/g, "") || "",
      });
    } else {
      res.status(404).json({ message: "Setlist not found" });
    }
  } catch (error) {
    console.error("Error fetching setlist:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/setlists/:showId/structured
 * 
 * Retrieve a structured setlist for a specific show optimized for scoring predictions.
 * 
 * Unlike the standard setlist endpoint, this returns a data structure specifically
 * designed for programmatic processing and prediction scoring, with songs organized
 * into sets with their positions clearly defined.
 * 
 * @param showId - The unique identifier for the show
 */
router.get("/setlists/:showId/structured", async (req, res) => {
  try {
    const { showId } = req.params;
    
    // Fetch raw setlist data from the Phish.net API
    const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
      username: "phishnet"
    });
    
    // Process the setlist if it exists
    if (Array.isArray(setlistData) && setlistData.length > 0) {
      // Convert raw API data into a structured format suitable for scoring
      // This uses the utility function that prepares setlists for prediction scoring
      const processedSetlist = processRawSetlist(setlistData);
      
      // Return the structured setlist
      res.json(processedSetlist);
    } else {
      res.status(404).json({ message: "Setlist not found" });
    }
  } catch (error) {
    console.error("Error fetching structured setlist:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;