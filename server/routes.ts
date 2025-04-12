import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchPhishData } from "./utils/api-utils";
import { insertSongSchema, insertShowSchema, insertPredictionSchema } from "@shared/schema";
import { z } from "zod";

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
      const showsData = await fetchPhishData("/shows/artist/phish", {
        order_by: "showdate",
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
      const showsData = await fetchPhishData("/shows/artist/phish", {
        order_by: "showdate",
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
      const setlistData = await fetchPhishData(`/setlists/showid/${showId}`);

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

  // Get or fetch all songs and their play counts
  app.get("/api/songs/all", async (_req, res) => {
    try {
      // Try to get from storage first
      let songs = await storage.getAllSongs();
      
      // If no songs in storage, fetch them
      if (songs.length === 0) {
        const songsData = await fetchPhishData("/songs/artist/phish");
        
        const formattedSongs = songsData.map((song: any) => ({
          name: song.name || song.song || "",
          slug: song.slug || "",
          times_played: song.times_played || 0
        }));
        
        // Save songs to storage
        for (const song of formattedSongs) {
          await storage.createSong({
            name: song.name,
            slug: song.slug,
            times_played: song.times_played
          });
        }
        
        songs = await storage.getAllSongs();
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

  // Initialize and seed data route (admin)
  app.post("/api/admin/seed", async (_req, res) => {
    try {
      // Fetch songs
      const songsData = await fetchPhishData("/songs/artist/phish");
      
      // Process and save songs
      const songsToSave = songsData.map((song: any) => ({
        name: song.name || song.song || "",
        slug: song.slug || song.name?.toLowerCase().replace(/\s+/g, '-') || "",
        times_played: song.times_played || 0
      }));
      
      // Save songs
      for (const song of songsToSave) {
        await storage.createSong(song);
      }
      
      res.json({ message: "Data seeded successfully", songsCount: songsToSave.length });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
