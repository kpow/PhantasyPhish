/**
 * Admin Routes Module
 * 
 * This module handles all administrative routes, including:
 * - User management
 * - Configuration management
 * - Tour management
 * - Show scoring and prediction management
 * - File management and downloads
 * 
 * These routes typically require admin authentication.
 */
import express from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth/middleware";
import { fetchPhishData, slugifySongName } from "../utils/api-utils";
import { insertSongSchema, insertShowSchema, insertTourSchema } from "@shared/schema";
import { scorePrediction, processRawSetlist } from "../utils/scoring-utils";
import { SetlistItem } from "@shared/types";
import { z } from "zod";
import fs from "fs";
import path from "path";
import archiver from "archiver";

const router = express.Router();

// Configuration constants
const CONFIG_KEY = 'app_config'; // Database key for storing the application config

// Default site configuration values - used when no config exists in the database yet
const DEFAULT_CONFIG = {
  testModeEnabled: true, // Enable test mode for development
  siteOverrides: {
    bannerMessage: null,
    maintenanceMode: false,
    predictionsClosed: false,
  }
};

// Check if user is an admin
router.get("/admin/check", isAuthenticated, isAdmin, (req, res) => {
  const user = req.user as any;
  res.json({
    isAdmin: true,
    userId: user.id,
    username: user.username
  });
});

// Seed data for tests
router.post("/admin/seed", async (_req, res) => {
  try {
    // This is a protected route that's only allowed in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: "Route only available in development environment" });
    }
    
    // Create sample songs
    const songs = [
      { name: "Sample in a Jar", slug: "sample-in-a-jar", times_played: 100 },
      { name: "Tweezer", slug: "tweezer", times_played: 200 },
      { name: "Bathtub Gin", slug: "bathtub-gin", times_played: 150 },
    ];
    
    for (const songData of songs) {
      await storage.createSong(songData);
    }
    
    // Create sample tour
    const tour = await storage.createTour({
      name: "Spring 2025",
      start_date: "2025-04-01",
      end_date: "2025-05-31"
    });
    
    // Create sample shows
    const shows = [
      { 
        show_id: "1111111", 
        date: "2025-04-20", 
        venue: "Madison Square Garden", 
        city: "New York", 
        state: "NY", 
        country: "USA",
        tour_id: tour.id,
        is_scored: false
      },
      { 
        show_id: "2222222", 
        date: "2025-04-21", 
        venue: "Madison Square Garden", 
        city: "New York", 
        state: "NY", 
        country: "USA",
        tour_id: tour.id,
        is_scored: false
      }
    ];
    
    for (const showData of shows) {
      await storage.createShow(showData);
    }
    
    res.json({ 
      message: "Test data seeded successfully",
      songs: songs.length,
      tours: 1,
      shows: shows.length
    });
  } catch (error) {
    console.error("Error seeding test data:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get all tours (admin version)
router.get("/admin/tours", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const tours = await storage.getAllTours();
    res.json({ tours });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Create a tour
router.post("/admin/tours", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    
    // Validate tour data
    const validatedData = insertTourSchema.parse({
      name,
      start_date,
      end_date
    });
    
    // Check if tour with this name already exists
    const existingTour = await storage.getTourByName(name);
    if (existingTour) {
      return res.status(400).json({ message: "Tour with this name already exists" });
    }
    
    // Create the tour
    const tour = await storage.createTour(validatedData);
    res.status(201).json({ message: "Tour created successfully", tour });
  } catch (error) {
    console.error("Error creating tour:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid tour data", errors: error.errors });
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

// Assign shows to a tour
router.post("/admin/tours/:tourId/assign-shows", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { tourId } = req.params;
    const { showIds } = req.body;
    
    if (!Array.isArray(showIds) || showIds.length === 0) {
      return res.status(400).json({ message: "No show IDs provided" });
    }
    
    // Check if tour exists
    const tour = await storage.getTour(parseInt(tourId));
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }
    
    // Update each show to assign it to the tour
    const results = [];
    const errors = [];
    
    for (const showId of showIds) {
      try {
        // Update the show's tour
        const updatedShow = await storage.updateShowTour(showId, parseInt(tourId));
        if (updatedShow) {
          results.push({
            showId,
            success: true,
            message: "Show assigned to tour"
          });
        } else {
          errors.push({
            showId,
            success: false,
            message: "Show not found"
          });
        }
      } catch (error) {
        console.error(`Error assigning show ${showId} to tour:`, error);
        errors.push({
          showId,
          success: false,
          message: (error as Error).message
        });
      }
    }
    
    res.json({
      message: `Assigned ${results.length} shows to tour, ${errors.length} errors`,
      tourId: parseInt(tourId),
      results,
      errors
    });
  } catch (error) {
    console.error("Error assigning shows to tour:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Test score a show's predictions
router.post("/admin/shows/:showId/test-score", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { showId } = req.params;
    const { actualSetlist } = req.body;
    
    if (!actualSetlist) {
      return res.status(400).json({ message: "No setlist data provided" });
    }
    
    // Get all predictions for this show
    const predictions = await storage.getShowPredictions(showId);
    
    if (predictions.length === 0) {
      return res.status(404).json({ message: "No predictions found for this show" });
    }
    
    // Score each prediction
    const scoredPredictions = predictions.map(prediction => {
      // Ensure the actualSetlist is properly typed for scorePrediction function
      const typedSetlist = actualSetlist as { set1: SetlistItem[]; set2: SetlistItem[]; encore: SetlistItem[] };
      const score = scorePrediction(prediction.setlist, typedSetlist);
      return {
        prediction_id: prediction.id,
        user_id: prediction.user_id,
        original_score: prediction.score,
        new_score: score.totalScore,
        details: score
      };
    });
    
    // Sort by score (highest first)
    scoredPredictions.sort((a, b) => b.new_score - a.new_score);
    
    res.json({
      message: `Test scored ${scoredPredictions.length} predictions`,
      showId,
      scoredPredictions
    });
  } catch (error) {
    console.error("Error test scoring predictions:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Score a show's predictions
router.post("/admin/shows/:showId/score", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { showId } = req.params;
    const { fetchSetlist } = req.body;
    
    // If fetchSetlist is true, get the setlist from the API
    let actualSetlist;
    
    if (fetchSetlist) {
      try {
        const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
          username: "phishnet"
        });
        
        if (!Array.isArray(setlistData) || setlistData.length === 0) {
          return res.status(404).json({ message: "Setlist not found in API" });
        }
        
        // Process the raw setlist data
        actualSetlist = processRawSetlist(setlistData);
      } catch (error) {
        console.error("Error fetching setlist from API:", error);
        return res.status(500).json({ 
          message: "Failed to fetch setlist from API", 
          error: (error as Error).message 
        });
      }
    } else {
      // Use provided setlist
      const { setlist } = req.body;
      if (!setlist) {
        return res.status(400).json({ message: "No setlist data provided" });
      }
      actualSetlist = setlist;
    }
    
    // Score all predictions for this show
    const result = await storage.scoreAllPredictionsForShow(showId);
    
    // Mark the show as scored
    const updatedShow = await storage.updateShowScoredStatus(showId, true);
    
    res.json({
      message: `Scored ${result.processed} predictions, ${result.updated} updated, ${result.errors} errors`,
      showId,
      isScored: updatedShow?.is_scored || true,
      ...result
    });
  } catch (error) {
    console.error("Error scoring show predictions:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get all users (admin only)
router.get("/admin/users", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    
    // Remove sensitive data
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json({ users: safeUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/admin/config
 * 
 * Get the current application configuration.
 * 
 * This endpoint returns the current state of the application config.
 * It's publicly accessible but provides additional info for admins.
 * Configuration is fetched from the database for persistence.
 */
router.get("/admin/config", async (req, res) => {
  // This is a special config endpoint that doesn't require authentication
  // so we can bootstrap the frontend with some basic configuration
  try {
    // Fetch configuration from database
    let config = await storage.getSiteConfig(CONFIG_KEY);
    
    // If no configuration exists yet, use default values
    if (!config) {
      config = { ...DEFAULT_CONFIG };
    }
    
    // Create a response object with the config data
    const configResponse = { ...config };
    
    // Add admin flag if authenticated as admin
    if (req.isAuthenticated() && (req.user as any)?.is_admin) {
      configResponse.admin = true;
    } else {
      configResponse.admin = false;
    }
    
    res.json({ config: configResponse });
  } catch (error) {
    console.error("Error fetching admin config:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * POST /api/admin/config
 * 
 * Update the application configuration.
 * 
 * This endpoint allows administrators to modify the application config.
 * Changes are persisted in the database for permanent storage.
 */
router.post("/admin/config", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ message: "No configuration data provided" });
    }
    
    // Log the configuration changes
    console.log("Admin updated site configuration:", config);
    
    // Get current config from database or use default
    let currentConfig = await storage.getSiteConfig(CONFIG_KEY);
    if (!currentConfig) {
      currentConfig = { ...DEFAULT_CONFIG };
    }
    
    // Merge the new config with the existing config and save to database
    const updatedConfig = { ...currentConfig, ...config };
    
    // Save updated config to the database
    await storage.saveSiteConfig(CONFIG_KEY, updatedConfig);
    
    // Return the updated config
    res.json({ 
      message: "Configuration updated successfully",
      config: { ...updatedConfig, admin: true }
    });
  } catch (error) {
    console.error("Error updating admin config:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Reset all prediction scores
router.post("/admin/reset-prediction-scores", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // This would reset all prediction scores back to 0
    // For now we just simulate this
    const { showId } = req.body;
    
    if (!showId) {
      return res.status(400).json({ message: "Show ID is required" });
    }
    
    // Get predictions for this show
    const predictions = await storage.getShowPredictions(showId);
    
    // Reset each prediction's score to 0
    const resetResults = [];
    for (const prediction of predictions) {
      const updated = await storage.updatePredictionScore(prediction.id, 0);
      resetResults.push({
        predictionId: prediction.id,
        userId: prediction.user_id,
        oldScore: prediction.score,
        newScore: updated.score
      });
    }
    
    // Un-mark the show as scored
    const updatedShow = await storage.updateShowScoredStatus(showId, false);
    
    res.json({
      message: `Reset scores for ${resetResults.length} predictions`,
      showId,
      isScored: updatedShow?.is_scored || false,
      resetResults
    });
  } catch (error) {
    console.error("Error resetting prediction scores:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/admin/uploads
 * 
 * Get a list of all uploaded files.
 * 
 * This endpoint scans the uploads directory and returns information about all files.
 * Requires admin authentication.
 */
router.get("/admin/uploads", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const baseUploadsDir = path.join(process.cwd(), "uploads");
    const files: Array<{path: string, name: string, size: number, type: string, created: Date}> = [];
    
    // Recursive function to scan directories
    const scanDirectory = (dirPath: string, relativePath: string = '') => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relPath = path.join(relativePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(fullPath, relPath);
        } else {
          // Add file info to the list
          const fileExtension = path.extname(item).toLowerCase();
          let fileType = 'other';
          
          // Detect file type based on extension
          if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(fileExtension)) {
            fileType = 'image';
          } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExtension)) {
            fileType = 'document';
          }
          
          files.push({
            path: relPath,
            name: item,
            size: stats.size,
            type: fileType,
            created: stats.birthtime
          });
        }
      }
    };
    
    // Start scanning from the base uploads directory
    scanDirectory(baseUploadsDir);
    
    // Sort files by creation date (newest first)
    files.sort((a, b) => b.created.getTime() - a.created.getTime());
    
    // Return the file list
    res.json({ 
      message: `Found ${files.length} uploaded files`,
      files
    });
  } catch (error) {
    console.error("Error listing uploaded files:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/admin/uploads/download
 * 
 * Download all uploaded files as a ZIP archive.
 * 
 * This endpoint creates a ZIP archive of all files in the uploads directory
 * and streams it to the client for download.
 * Requires admin authentication.
 */
router.get("/admin/uploads/download", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const baseUploadsDir = path.join(process.cwd(), "uploads");
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const archiveName = `uploads_backup_${timestamp}.zip`;
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${archiveName}`);
    
    // Create a ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level (0-9)
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Recursive function to add files and directories to the archive
    const addDirectoryToArchive = (dirPath: string, relativePath: string = '') => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const archivePath = path.join(relativePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively add subdirectories
          addDirectoryToArchive(fullPath, archivePath);
        } else {
          // Add file to the archive
          archive.file(fullPath, { name: archivePath });
        }
      }
    };
    
    // Start adding files from the base uploads directory
    addDirectoryToArchive(baseUploadsDir);
    
    // Finalize the archive
    await archive.finalize();
    
    // No need to explicitly end the response here as it's handled by the archive pipe
  } catch (error) {
    console.error("Error creating ZIP archive of uploads:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;