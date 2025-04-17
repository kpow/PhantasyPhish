/**
 * Leaderboard Routes Module
 * 
 * This module handles routes related to leaderboards and scoring, including:
 * - Global leaderboards across all shows
 * - Show-specific leaderboards
 * - Score calculation and aggregation
 * 
 * Leaderboards provide competitive rankings of users based on their prediction scores,
 * encouraging engagement with the setlist prediction game.
 */
import express from "express";
import { storage } from "../storage";

const router = express.Router();

/**
 * GET /api/leaderboard
 * 
 * Retrieve the global leaderboard across all shows.
 * 
 * This endpoint aggregates user scores across all predictions to create a
 * comprehensive global ranking. It returns data sorted by highest total score,
 * including participation statistics and avatars for user identification.
 * 
 * Query Parameters:
 * - limit: Optional parameter to limit the number of results (default: 10)
 */
router.get("/leaderboard", async (req, res) => {
  try {
    // Extract limit parameter with default of 10 if not provided
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get global leaderboard with the specified limit
    const leaderboard = await storage.getGlobalLeaderboard(limit);
    
    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching global leaderboard:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/shows/:showId/leaderboard
 * 
 * Retrieve the leaderboard for a specific show.
 * 
 * This endpoint provides rankings based solely on predictions for the specified show.
 * It returns users sorted by their prediction score for that particular concert.
 * 
 * @param showId - The unique identifier for the show
 */
router.get("/shows/:showId/leaderboard", async (req, res) => {
  try {
    const { showId } = req.params;
    
    // Get the leaderboard for this specific show
    const leaderboard = await storage.getLeaderboardForShow(showId);
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Return the leaderboard with show ID for reference
    res.json({
      showId,
      leaderboard
    });
  } catch (error) {
    console.error("Error fetching show leaderboard:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;