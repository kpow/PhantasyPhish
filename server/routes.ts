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

  // Get or fetch all songs and their play counts
  app.get("/api/songs/all", async (_req, res) => {
    try {
      // Try to get from storage first
      let songs = await storage.getAllSongs();
      
      // Local file path for caching songs data
      const songsFilePath = path.join(process.cwd(), 'phish_songs.json');
      
      // If no songs in storage, check if we have a local file
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
            // Continue to API fetching if file read fails
          }
        }
        
        // If still no songs, fetch from API
        if (songs.length === 0) {
          console.log("No cached songs found, fetching from setlists API...");
          
          // Instead of trying to filter shows, let's use specific show IDs from different eras
          // We're using a combination of legendary shows, recent shows, and shows with unique repertoire
          const showIds = [
            // Recent shows from 2025
            "1718730981", // Cancun 2025-02-01
            "1737486654", // Seattle 2025-04-18
            "1737486683", // Seattle 2025-04-19
            
            // Classic 1.0 era shows (1990s)
            "1282471487", // Big Cypress 1999-12-31
            "1251594895", // UIC Pavilion 1994-06-18 (OJ show)
            "1252170044", // The Great Went 1997-08-16
            "1252170063", // The Great Went 1997-08-17
            "1252339266", // Island Tour 1998-04-02
            "1252339284", // Island Tour 1998-04-03
            "1252339302", // Island Tour 1998-04-04
            "1252339320", // Island Tour 1998-04-05
            "1252338950", // Hampton 1997-11-21
            "1252338968", // Hampton 1997-11-22
            "1252338986", // Hampton 1997-11-23
            
            // 2.0 era shows (2002-2004)
            "1252676302", // IT Festival 2003-08-02
            "1252676320", // IT Festival 2003-08-03
            "1252861803", // Coventry 2004-08-15
            "1252861785", // Coventry 2004-08-14
            
            // 3.0 era shows (2009-present)
            "1254469716", // Hampton 2009-03-06 (3.0 era start)
            "1374010871", // Baker's Dozen 2017-07-21
            "1374010889", // Baker's Dozen 2017-07-22
            "1374010907", // Baker's Dozen 2017-07-23
            "1374010925", // Baker's Dozen 2017-07-25
            "1374010943", // Baker's Dozen 2017-07-26
            "1374010961", // Baker's Dozen 2017-07-28
            "1374010979", // Baker's Dozen 2017-07-29
            "1374010997", // Baker's Dozen 2017-07-30
            "1393021145", // MSG 2018-12-31
            
            // Recent shows
            "1550133398", // Atlantic City 2021-08-13
            "1627969236", // MSG 2022-04-20
            "1718730841", // Mexico 2023-02-23
            
            // Halloween shows (with covers/musical costumes)
            "1254664481", // Festival 8 2009-10-31 (Exile on Main St.)
            "1310796334", // Atlantic City 2010-10-31 (Waiting for Columbus)
            "1356537886", // Atlantic City 2013-10-31 (Wingsuit)
            "1441577299", // Las Vegas 2014-10-31 (Chilling, Thrilling Sounds)
            "1508542997", // Las Vegas 2016-10-31 (Ziggy Stardust)
            "1596073502", // Las Vegas 2018-10-31 (Kasvot Växt)
            "1641044090", // Las Vegas 2021-10-31 (Sci-Fi Soldier)
            
            // Special shows and festivals
            "1311956034", // Super Ball IX 2011-07-01
            "1311956052", // Super Ball IX 2011-07-02
            "1311956070", // Super Ball IX 2011-07-03
            "1441837964", // Magnaball 2015-08-21
            "1441837977", // Magnaball 2015-08-22
            "1441837995", // Magnaball 2015-08-23
            "1678914518", // MSG 2022-12-31 (New Year's)
            "1678914541", // MSG 2023-01-01 (New Year's)
          ];
          
          console.log(`Fetching setlists for ${showIds.length} specific shows across different eras...`);
          
          // Create a Map to store unique songs by ID
          const uniqueSongs = new Map();
          
          // Fetch setlists for each show and extract songs
          for (const showId of showIds) {
            try {
              const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
                username: "phishnet"
              });
              
              if (Array.isArray(setlistData) && setlistData.length > 0) {
                // Extract unique songs from setlist
                setlistData.forEach((item: any) => {
                  if (item.songid && item.song && !uniqueSongs.has(item.songid)) {
                    // Store all potentially useful song information
                    uniqueSongs.set(item.songid, {
                      id: item.songid,
                      name: item.song,
                      slug: item.slug || slugifySongName(item.song),
                      times_played: parseInt(item.gap || "0"),
                      artist_name: item.artist_name || "Phish",
                      artist_slug: item.artist_slug,
                      is_cover: item.is_original === "0",
                      debut_date: item.debut_date,
                      last_played_date: item.last_played_date,
                      jam_chart: item.isjamchart === "1",
                      jamchart_description: item.jamchart_description || "",
                      footnote: item.footnote || "",
                      // Store any additional fields that might be useful
                      meta: {
                        tour_name: item.tourname || "",
                        is_soundcheck: item.soundcheck === "1",
                        transition_mark: item.trans_mark || "",
                        set_name: item.set || ""
                      }
                    });
                  }
                });
              }
              console.log(`Processed show ${showId}, current song count: ${uniqueSongs.size}`);
            } catch (err) {
              console.error(`Error fetching setlist for show ${showId}:`, err);
              // Continue with next show
            }
          }
          
          console.log(`Found ${uniqueSongs.size} unique songs from setlists`);
          
          // Convert Map to Array for storage
          const songsArray = Array.from(uniqueSongs.values());
          
          // Save songs to local file for future use
          fs.writeFileSync(songsFilePath, JSON.stringify(songsArray, null, 2));
          console.log(`Saved ${songsArray.length} songs to ${songsFilePath}`);
          
          // Save songs to storage
          for (const songData of songsArray) {
            await storage.createSong({
              name: songData.name,
              slug: songData.slug,
              times_played: songData.times_played
            });
          }
          
          songs = await storage.getAllSongs();
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

  // Initialize and seed data route (admin)
  app.post("/api/admin/seed", async (_req, res) => {
    try {
      // Fetch songs
      const songsData = await fetchPhishData("/songs/artist/phish.json", {
        username: "phishnet"
      });
      
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
