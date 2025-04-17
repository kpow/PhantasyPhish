/**
 * Tours Routes Module
 * 
 * This module handles all routes related to Phish tours, including:
 * - Retrieving tour information and associated shows
 * - Getting tour-specific leaderboards and user scores
 * 
 * A tour represents a specific sequence of Phish concerts grouped together,
 * such as "Spring 2025" or "Summer Tour 2025".
 */
import express from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth/middleware";

const router = express.Router();

/**
 * GET /api/tours
 * 
 * Retrieve a list of all Phish tours.
 * This endpoint provides basic information about all tours in the database.
 */
router.get("/tours", async (_req, res) => {
  try {
    // Fetch all tours from the database
    const tours = await storage.getAllTours();
    res.json({ tours });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/tours/:tourId/shows
 * 
 * Retrieve all shows associated with a specific tour.
 * 
 * This endpoint provides a list of all shows that belong to the specified tour,
 * which can be used to display tour schedules and for prediction planning.
 * 
 * @param tourId - The unique identifier for the tour
 */
router.get("/tours/:tourId/shows", async (req, res) => {
  try {
    const { tourId } = req.params;
    // Get shows for the specified tour
    const shows = await storage.getShowsByTour(parseInt(tourId));
    res.json({ shows });
  } catch (error) {
    console.error("Error fetching tour shows:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/tours/:tourId/leaderboard
 * 
 * Retrieve the leaderboard for a specific tour.
 * 
 * This endpoint aggregates prediction scores across all shows in a tour
 * to create a comprehensive tour leaderboard. It returns user rankings
 * based on total score, number of shows participated in, and best individual
 * show score.
 * 
 * @param tourId - The unique identifier for the tour
 */
router.get("/tours/:tourId/leaderboard", async (req, res) => {
  try {
    const { tourId } = req.params;
    
    // Get the leaderboard for this tour
    const leaderboard = await storage.getLeaderboardForTour(parseInt(tourId));
    
    // Sort by total score (highest first)
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    
    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching tour leaderboard:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/users/current/tours/:tourId/score
 * 
 * Retrieve the authenticated user's score for a specific tour.
 * 
 * This endpoint requires authentication and returns the user's
 * total score across all shows in the specified tour along with
 * participation statistics.
 * 
 * @param tourId - The unique identifier for the tour
 */
router.get("/users/current/tours/:tourId/score", isAuthenticated, async (req, res) => {
  try {
    const { tourId } = req.params;
    const userId = (req.user as any).id;
    
    // Get the user's score for this tour
    const score = await storage.getUserScoreForTour(userId, parseInt(tourId));
    
    res.json({
      userId,
      tourId: parseInt(tourId),
      ...score
    });
  } catch (error) {
    console.error("Error fetching user's tour score:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;