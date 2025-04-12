import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchPhishData, slugifySongName } from "./utils/api-utils";
import { insertSongSchema, insertShowSchema, insertPredictionSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get most recent show
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
      const predictionData = insertPredictionSchema.parse(req.body);
      const savedPrediction = await storage.createPrediction(predictionData);
      res.status(201).json(savedPrediction);
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
