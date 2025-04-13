import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchPhishData, slugifySongName } from "./utils/api-utils";
import { insertSongSchema, insertShowSchema, insertPredictionSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";
import authRoutes from "./auth/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes
  app.use("/api/auth", authRoutes);
  
  // API Routes
  
  // Get all songs
  app.get("/api/songs", async (_req, res) => {
    try {
      const songs = await storage.getAllSongs();
      res.json({ songs });
    } catch (error) {
      console.error("Error fetching songs:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get upcoming shows
  app.get("/api/shows/upcoming", async (_req, res) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      // Add username: "phishnet" parameter to avoid using koolyp data
      const showsData = await fetchPhishData("/shows/artist/phish.json", {
        order_by: "showdate",
        username: "phishnet"
      });
      
      const upcomingShows = showsData.filter((show: any) => show.showdate >= currentDate);
      const formattedShows = upcomingShows.slice(0, 5).map((show: any) => ({
        showid: show.showid,
        showdate: show.showdate,
        venue: show.venue,
        location: `${show.city}, ${show.state}`,
        country: show.country,
      }));
      
      res.json({ shows: formattedShows });
    } catch (error) {
      console.error("Error fetching upcoming shows:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get details for a specific show by ID
  app.get("/api/shows/details/:showId", async (req, res) => {
    try {
      const { showId } = req.params;
      const showsData = await fetchPhishData("/shows/artist/phish.json", {
        order_by: "showdate",
        username: "phishnet"
      });
      
      const show = showsData.find((s: any) => s.showid === showId);
      
      if (show) {
        res.json({
          showid: show.showid,
          showdate: show.showdate,
          venue: show.venue,
          location: `${show.city}, ${show.state}`,
          country: show.country
        });
      } else {
        res.status(404).json({ message: "Show not found" });
      }
    } catch (error) {
      console.error("Error fetching show details:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

// Get most recent show (singular) - kept for backward compatibility
  app.get("/api/shows/recent", async (_req, res) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const showsData = await fetchPhishData("/shows/artist/phish.json", {
        order_by: "showdate",
        username: "phishnet"
      });
      
      const pastShows = showsData.filter((show: any) => show.showdate < currentDate);
      const recentShow = pastShows[pastShows.length - 1];

      if (recentShow) {
        res.json({
          showid: recentShow.showid,
          showdate: recentShow.showdate,
          venue: recentShow.venue,
          location: `${recentShow.city}, ${recentShow.state}`,
          country: recentShow.country,
        });
      } else {
        res.status(404).json({ message: "No recent shows found" });
      }
    } catch (error) {
      console.error("Error fetching recent show:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get multiple recent shows
  app.get("/api/shows/recent/multiple", async (_req, res) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const showsData = await fetchPhishData("/shows/artist/phish.json", {
        order_by: "showdate",
        username: "phishnet"
      });
      
      const pastShows = showsData.filter((show: any) => show.showdate < currentDate);
      // Get the 4 most recent shows
      const recentShows = pastShows.slice(-4).reverse();

      if (recentShows.length > 0) {
        const formattedShows = recentShows.map((show: any) => ({
          showid: show.showid,
          showdate: show.showdate,
          venue: show.venue,
          location: `${show.city}, ${show.state}`,
          country: show.country,
        }));
        
        res.json({ shows: formattedShows });
      } else {
        res.status(404).json({ message: "No recent shows found" });
      }
    } catch (error) {
      console.error("Error fetching recent shows:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get setlist for a specific show
  app.get("/api/setlists/:showId", async (req, res) => {
    try {
      const { showId } = req.params;
      const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
        username: "phishnet"
      });

      if (Array.isArray(setlistData) && setlistData.length > 0) {
        const setGroups = setlistData.reduce((acc: any, song: any) => {
          if (!acc[song.set]) {
            acc[song.set] = [];
          }
          acc[song.set].push({
            name: song.song,
            transition: song.trans_mark,
            position: song.position,
            jamchart: song.isjamchart ? song.jamchart_description : null,
          });
          return acc;
        }, {});

        const formatSet = (songs: any[]) => {
          return songs
            .sort((a, b) => a.position - b.position)
            .map((song) => song.name + song.transition)
            .join(" ")
            .trim();
        };

        let setlistText = "";
        if (setGroups["1"]) {
          setlistText += "Set 1: " + formatSet(setGroups["1"]) + "\n\n";
        }
        if (setGroups["2"]) {
          setlistText += "Set 2: " + formatSet(setGroups["2"]) + "\n\n";
        }
        if (setGroups["e"]) {
          setlistText += "Encore: " + formatSet(setGroups["e"]) + "\n\n";
        }

        const firstSong = setlistData[0];
        res.json({
          showdate: firstSong.showdate,
          venue: firstSong.venue,
          location: `${firstSong.city}, ${firstSong.state}`,
          setlistdata: setlistText,
          setlistnotes:
            firstSong.setlistnotes?.replace(/<\/?[^>]+(>|$)/g, "") || "",
        });
      } else {
        res.status(404).json({ message: "Setlist not found" });
      }
    } catch (error) {
      console.error("Error fetching setlist:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get all songs from local data file
  app.get("/api/songs/all", async (_req, res) => {
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
            
            // Save to storage
            for (const song of songsList) {
              await storage.createSong({
                name: song.name,
                slug: song.slug,
                times_played: song.times_played
              });
            }
            
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

  // Save a prediction
  app.post("/api/predictions", async (req, res) => {
    try {
      // Make sure user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = (req.user as { id: number }).id;
      const { show_id, setlist } = req.body;
      
      if (!show_id || !setlist) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if this user already has a prediction for this show
      const userPredictions = await storage.getUserPredictions(userId);
      const existingPrediction = userPredictions.find(p => p.show_id === show_id);
      
      let savedPrediction;
      
      if (existingPrediction) {
        // Delete the existing prediction first using the storage method
        try {
          // Delete old prediction
          const deleted = await storage.deletePredictionByUserAndShow(userId, show_id);
          
          if (!deleted) {
            console.warn(`No prediction found to delete for user ${userId} and show ${show_id}`);
          }
          
          // Create a new one with updated setlist
          savedPrediction = await storage.createPrediction({
            user_id: userId,
            show_id: show_id,
            setlist: setlist
          });
          
          // Return different message to indicate update
          return res.status(200).json({ 
            message: "Prediction updated successfully", 
            prediction: savedPrediction,
            updated: true
          });
        } catch (error) {
          console.error("Error updating prediction:", error);
          return res.status(500).json({ message: "Failed to update prediction" });
        }
      } else {
        // Create a new prediction
        savedPrediction = await storage.createPrediction({
          user_id: userId,
          show_id: show_id,
          setlist: setlist
        });
      }
      
      res.status(201).json({ 
        message: "Prediction saved successfully", 
        prediction: savedPrediction 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid prediction data", errors: error.errors });
      } else {
        console.error("Error saving prediction:", error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  });

  // Get predictions for a user
  app.get("/api/users/:userId/predictions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const predictions = await storage.getUserPredictions(userId);
      res.json({ predictions });
    } catch (error) {
      console.error("Error fetching user predictions:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get prediction for current user and specific show
  app.get("/api/users/current/predictions/:showId", async (req, res) => {
    try {
      // Make sure user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = (req.user as { id: number }).id;
      const { showId } = req.params;
      
      // Get all user predictions
      const predictions = await storage.getUserPredictions(userId);
      
      // Find prediction for this specific show
      const prediction = predictions.find(p => p.show_id === showId);
      
      if (prediction) {
        res.json({ prediction });
      } else {
        res.json({ prediction: null });
      }
    } catch (error) {
      console.error("Error fetching prediction for show:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Initialize data from local file (admin)
  app.post("/api/admin/seed", async (_req, res) => {
    try {
      console.log("Loading songs from local file...");
      
      // Local file path for song data
      const songsFilePath = path.join(process.cwd(), 'data', 'phish_songs.json');
      
      if (!fs.existsSync(songsFilePath)) {
        throw new Error(`Songs file not found at: ${songsFilePath}`);
      }
      
      // Read from the file
      const fileData = fs.readFileSync(songsFilePath, 'utf8');
      const songsList = JSON.parse(fileData);
      
      console.log(`Loaded ${songsList.length} songs from local file`);
      
      // Clear existing songs (would require a clearSongs method)
      // Save to storage
      for (const song of songsList) {
        await storage.createSong({
          name: song.name,
          slug: song.slug,
          times_played: song.times_played
        });
      }
      
      const songs = await storage.getAllSongs();
      res.json({ message: "Data seeded successfully", songsCount: songs.length });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
