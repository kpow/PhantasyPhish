import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchPhishData, slugifySongName } from "./utils/api-utils";
import { insertSongSchema, insertShowSchema, insertPredictionSchema } from "@shared/schema";
import { scorePrediction, processRawSetlist } from "./utils/scoring-utils";
import { z } from "zod";
import fs from "fs";
import path from "path";
import authRoutes from "./auth/routes";
import { isAuthenticated, isAdmin } from "./auth/middleware";
import { db } from "./database";

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
  
  // Reload songs from the JSON file - useful when we add new songs to the database
  app.post("/api/songs/reload", async (_req, res) => {
    try {
      // Get the song we're looking for
      const songsFilePath = path.join(process.cwd(), 'data', 'phish_songs.json');
      
      // Check if local file exists
      if (fs.existsSync(songsFilePath)) {
        console.log("Loading songs from cached file...");
        try {
          // Read all songs from the file
          const fileData = fs.readFileSync(songsFilePath, 'utf8');
          const songsList = JSON.parse(fileData);
          
          console.log(`Found ${songsList.length} songs in file, checking for new songs...`);
          
          // Get existing songs
          const existingSongs = await storage.getAllSongs();
          const existingSongNames = new Set(existingSongs.map(song => song.name));
          
          // Filter to new songs only
          const newSongs = songsList.filter((song: {name: string, slug: string, times_played: number}) => !existingSongNames.has(song.name));
          
          if (newSongs.length === 0) {
            return res.json({ message: "No new songs found to add", songsAdded: 0 });
          }
          
          // Save new songs to storage
          for (const song of newSongs) {
            await storage.createSong({
              name: song.name,
              slug: song.slug,
              times_played: song.times_played
            });
            console.log(`Added new song: ${song.name}`);
          }
          
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

  // Save a prediction
  app.post("/api/predictions", async (req, res) => {
    try {
      // Make sure user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = (req.user as { id: number }).id;
      let { show_id, setlist } = req.body;
      
      if (!show_id || !setlist) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Clean up the setlist by removing null entries
      if (setlist) {
        // Filter out any null entries in each set
        setlist.set1 = setlist.set1.filter((song: any) => song !== null);
        setlist.set2 = setlist.set2.filter((song: any) => song !== null);
        setlist.encore = setlist.encore.filter((song: any) => song !== null);
      }
      
      // Check if this user already has a prediction for this show
      console.log(`Looking for predictions for user ${userId} and show ${show_id}`);
      const userPredictions = await storage.getUserPredictions(userId);
      console.log(`Found ${userPredictions.length} predictions for user ${userId}`);
      console.log(`User predictions:`, userPredictions.map(p => ({ id: p.id, show_id: p.show_id })));
      
      console.log(`Looking for show_id type: ${typeof show_id}, value: '${show_id}'`);
      console.log(`User prediction show_ids:`, userPredictions.map(p => `${typeof p.show_id}, value: '${p.show_id}'`));
      
      // Ensure string comparison by converting both to strings
      const existingPrediction = userPredictions.find(p => String(p.show_id) === String(show_id));
      console.log(`Existing prediction found:`, existingPrediction ? true : false);
      
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
      
      // Find prediction for this specific show - ensure string comparison
      const prediction = predictions.find(p => String(p.show_id) === String(showId));
      
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
  
  // Delete a prediction for current user and specific show
  app.delete("/api/users/current/predictions/:showId", async (req, res) => {
    try {
      // Make sure user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = (req.user as { id: number }).id;
      const { showId } = req.params;
      
      // Delete the prediction
      const deleted = await storage.deletePredictionByUserAndShow(userId, showId);
      
      if (deleted) {
        res.json({ success: true, message: "Prediction successfully deleted" });
      } else {
        res.status(404).json({ success: false, message: "No prediction found to delete" });
      }
    } catch (error) {
      console.error("Error deleting prediction:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
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

  // Score a prediction against a real setlist
  app.post("/api/predictions/:predictionId/score", async (req, res) => {
    try {
      // Make sure user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const predictionId = parseInt(req.params.predictionId);
      const userId = (req.user as { id: number }).id;
      
      // Get the prediction
      const prediction = await storage.getPrediction(predictionId);
      
      if (!prediction) {
        return res.status(404).json({ message: "Prediction not found" });
      }
      
      // Check if the prediction belongs to the user
      if (prediction.user_id !== userId) {
        return res.status(403).json({ message: "You can only score your own predictions" });
      }
      
      // Check that we have a valid setlist in the prediction
      // The setlist is stored as a JSON string and needs to be parsed
      let predictionSetlistData: any;
      try {
        if (typeof prediction.setlist === 'string') {
          predictionSetlistData = JSON.parse(prediction.setlist);
        } else {
          predictionSetlistData = prediction.setlist;
        }
      } catch (e) {
        console.error("Error parsing prediction setlist:", e);
        predictionSetlistData = { set1: [], set2: [], encore: [] };
      }
      
      // Get the actual setlist from Phish API
      const actualSetlistData = await fetchPhishData(`/setlists/showid/${prediction.show_id}.json`, {
        username: "phishnet"
      });
      
      if (!Array.isArray(actualSetlistData) || actualSetlistData.length === 0) {
        return res.status(404).json({ message: "Setlist not found for this show" });
      }
      
      // Process the raw setlist data
      const processedSetlist = processRawSetlist(actualSetlistData);
      
      // Use the prediction setlist data we parsed earlier
      const predictionSetlist = {
        set1: Array.isArray(predictionSetlistData.set1) ? predictionSetlistData.set1 : [],
        set2: Array.isArray(predictionSetlistData.set2) ? predictionSetlistData.set2 : [],
        encore: Array.isArray(predictionSetlistData.encore) ? predictionSetlistData.encore : []
      };
      const scoreBreakdown = scorePrediction(predictionSetlist, processedSetlist);
      
      // Update the prediction with the score
      const updatedPrediction = await storage.updatePredictionScore(predictionId, scoreBreakdown.totalScore);
      
      res.json({
        prediction: updatedPrediction,
        score: scoreBreakdown.totalScore,
        breakdown: scoreBreakdown,
        actualSetlist: processedSetlist
      });
    } catch (error) {
      console.error("Error scoring prediction:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get structured setlist data for scoring (includes raw data for test purposes)
  app.get("/api/setlists/:showId/structured", async (req, res) => {
    try {
      const { showId } = req.params;
      const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
        username: "phishnet"
      });

      if (Array.isArray(setlistData) && setlistData.length > 0) {
        // Process the setlist into our scoring format
        const processedSetlist = processRawSetlist(setlistData);
        
        res.json({
          processedSetlist,
          rawSetlistData: setlistData  // For debugging/test purposes
        });
      } else {
        res.status(404).json({ message: "Setlist not found" });
      }
    } catch (error) {
      console.error("Error fetching structured setlist:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Test endpoint for scoring (useful for debugging and testing)
  app.post("/api/test/score", async (req, res) => {
    try {
      const { prediction, actualSetlist } = req.body;
      
      if (!prediction || !actualSetlist) {
        return res.status(400).json({ message: "Missing prediction or actualSetlist" });
      }

      // Log the incoming prediction and actual setlist for debugging
      console.log("Testing score with prediction:", JSON.stringify(prediction));
      console.log("Testing against actual setlist:", JSON.stringify(actualSetlist));
      
      // Score the prediction
      // Need to ensure the prediction setlist matches the expected format
      const predictionSetlist = {
        set1: Array.isArray(prediction.set1) ? prediction.set1 : [],
        set2: Array.isArray(prediction.set2) ? prediction.set2 : [],
        encore: Array.isArray(prediction.encore) ? prediction.encore : []
      };
      
      const scoreBreakdown = scorePrediction(predictionSetlist, actualSetlist);
      
      // Log the scoring breakdown for debugging
      console.log("Score breakdown:", JSON.stringify(scoreBreakdown));
      
      res.json({
        score: scoreBreakdown.totalScore,
        breakdown: scoreBreakdown
      });
    } catch (error) {
      console.error("Error in test scoring:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Admin routes
  // Admin check route - to verify if a user has admin privileges
  app.get("/api/admin/check", isAuthenticated, isAdmin, (req, res) => {
    res.json({ 
      message: "You have admin access",
      user: {
        id: (req.user as any).id,
        email: (req.user as any).email,
        display_name: (req.user as any).display_name
      }
    });
  });
  
  // Tours management (admin only)
  app.get("/api/admin/tours", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const tours = await storage.getAllTours();
      res.json({ tours });
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.post("/api/admin/tours", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tourSchema = z.object({
        name: z.string().min(1, "Tour name is required"),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
        description: z.string().optional()
      });
      
      const validatedData = tourSchema.parse(req.body);
      const newTour = await storage.createTour(validatedData);
      
      res.status(201).json({ 
        message: "Tour created successfully", 
        tour: newTour 
      });
    } catch (error) {
      console.error("Error creating tour:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Assign shows to a tour (admin only)
  app.post("/api/admin/tours/:tourId/assign-shows", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { tourId } = req.params;
      const { showIds } = req.body as { showIds: string[] };
      
      if (!Array.isArray(showIds) || showIds.length === 0) {
        return res.status(400).json({ message: "No show IDs provided" });
      }
      
      const tourIdNum = parseInt(tourId);
      const tour = await storage.getTour(tourIdNum);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      // For each show ID, update the tour_id field
      const results = [];
      for (const showId of showIds) {
        const show = await storage.getShowByShowId(showId);
        if (show) {
          // Update the show's tour ID using our storage method
          const updatedShow = await storage.updateShowTour(showId, tourIdNum);
          if (updatedShow) {
            results.push(updatedShow);
          }
        }
      }
      
      res.json({ 
        message: `${results.length} shows assigned to tour "${tour.name}"`,
        assignedShowIds: results.map(show => show.show_id)
      });
    } catch (error) {
      console.error("Error assigning shows to tour:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Score all predictions for a show (admin only)
  app.post("/api/admin/shows/:showId/score", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { showId } = req.params;
      
      // Get all predictions for this show
      const predictions = await storage.getShowPredictions(showId);
      
      if (predictions.length === 0) {
        return res.status(404).json({ message: "No predictions found for this show" });
      }
      
      // Fetch the actual setlist from Phish API
      const actualSetlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
        username: "phishnet"
      });
      
      if (!Array.isArray(actualSetlistData) || actualSetlistData.length === 0) {
        return res.status(404).json({ message: "Setlist not found for this show" });
      }
      
      // Process the raw setlist data
      const processedSetlist = processRawSetlist(actualSetlistData);
      
      let processed = 0;
      let updated = 0;
      let errors = 0;
      
      // Score each prediction
      for (const prediction of predictions) {
        try {
          processed++;
          
          // Parse the prediction setlist
          let predictionSetlistData;
          try {
            if (typeof prediction.setlist === 'string') {
              predictionSetlistData = JSON.parse(prediction.setlist);
            } else {
              predictionSetlistData = prediction.setlist;
            }
          } catch (e) {
            console.error(`Error parsing prediction setlist for prediction ID ${prediction.id}:`, e);
            errors++;
            continue;
          }
          
          // Format the prediction data to match what scorePrediction expects
          const predictionSetlist = {
            set1: Array.isArray(predictionSetlistData.set1) 
              ? predictionSetlistData.set1.map((item: any, index: number) => ({
                  position: index,
                  song: item ? { id: item.id, name: item.name } : null
                }))
              : [],
            set2: Array.isArray(predictionSetlistData.set2) 
              ? predictionSetlistData.set2.map((item: any, index: number) => ({
                  position: index,
                  song: item ? { id: item.id, name: item.name } : null
                }))
              : [],
            encore: Array.isArray(predictionSetlistData.encore) 
              ? predictionSetlistData.encore.map((item: any, index: number) => ({
                  position: index,
                  song: item ? { id: item.id, name: item.name } : null
                }))
              : []
          };
          
          // Score the prediction
          const scoreBreakdown = scorePrediction(predictionSetlist, processedSetlist);
          
          // Update the prediction score
          await storage.updatePredictionScore(prediction.id, scoreBreakdown.totalScore);
          updated++;
        } catch (error) {
          console.error(`Error scoring prediction ID ${prediction.id}:`, error);
          errors++;
        }
      }
      
      // Mark the show as scored
      await storage.updateShowScoredStatus(showId, true);
      
      res.json({
        message: "Show scoring complete",
        stats: {
          processed,
          updated,
          errors
        }
      });
    } catch (error) {
      console.error("Error scoring show:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get all users (admin-only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      // Get all users - we'd need to add this method to storage
      // For now, mock with a placeholder response
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Configuration endpoint to get app settings
  app.get("/api/admin/config", async (req, res) => {
    try {
      // Define the config schema
      const configSchema = z.object({
        testModeEnabled: z.boolean().default(true)
      });
      
      // Check if config file exists, if not create default
      const configPath = path.join(process.cwd(), 'config.json');
      
      if (!fs.existsSync(configPath)) {
        // Create default config
        const defaultConfig = {
          testModeEnabled: true
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      }
      
      // Read the config file
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Validate with zod
      const config = configSchema.parse(configData);
      
      res.json({ config });
    } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Update app configuration (admin-only)
  app.post("/api/admin/config", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Define the config schema
      const configSchema = z.object({
        config: z.object({
          testModeEnabled: z.boolean()
        })
      });
      
      // Validate the request body
      const { config } = configSchema.parse(req.body);
      
      // Write to config file
      const configPath = path.join(process.cwd(), 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      res.json({ 
        message: "Configuration updated successfully",
        config 
      });
    } catch (error) {
      console.error("Error updating configuration:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Public leaderboard endpoints
  // Get tours for leaderboard
  app.get("/api/tours", async (_req, res) => {
    try {
      const tours = await storage.getAllTours();
      res.json({ tours });
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get shows for a specific tour
  app.get("/api/tours/:tourId/shows", async (req, res) => {
    try {
      const tourId = parseInt(req.params.tourId);
      const shows = await storage.getShowsByTour(tourId);
      res.json({ shows });
    } catch (error) {
      console.error("Error fetching tour shows:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get leaderboard for a specific show
  app.get("/api/shows/:showId/leaderboard", async (req, res) => {
    try {
      const { showId } = req.params;
      
      // Get the show to check if it's been scored
      const show = await storage.getShowByShowId(showId);
      
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      
      if (!show.is_scored) {
        return res.status(400).json({ message: "This show has not been scored yet" });
      }
      
      const leaderboard = await storage.getLeaderboardForShow(showId);
      res.json({ leaderboard });
    } catch (error) {
      console.error("Error fetching show leaderboard:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get leaderboard for a specific tour
  app.get("/api/tours/:tourId/leaderboard", async (req, res) => {
    try {
      const tourId = parseInt(req.params.tourId);
      
      // Get the tour to verify it exists
      const tour = await storage.getTour(tourId);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      const leaderboard = await storage.getLeaderboardForTour(tourId);
      res.json({ 
        tourName: tour.name,
        leaderboard 
      });
    } catch (error) {
      console.error("Error fetching tour leaderboard:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get current user's score for a specific tour
  app.get("/api/users/current/tours/:tourId/score", isAuthenticated, async (req, res) => {
    try {
      const tourId = parseInt(req.params.tourId);
      const userId = (req.user as any).id;
      
      // Get the tour to verify it exists
      const tour = await storage.getTour(tourId);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      const userScore = await storage.getUserScoreForTour(userId, tourId);
      res.json({ 
        tourName: tour.name,
        score: userScore
      });
    } catch (error) {
      console.error("Error fetching user tour score:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
