/**
 * Shows Routes Module
 * 
 * This module handles all routes related to Phish concert shows, including:
 * - Fetching upcoming and recent shows
 * - Getting detailed information about specific shows
 * - Checking show status (scoring status, tour assignment)
 * 
 * Data is sourced from both the Phish.net API and our local database.
 */
import express from "express";
import { storage } from "../storage";
import { fetchPhishData } from "../utils/api-utils";

const router = express.Router();

/**
 * GET /api/shows/upcoming
 * 
 * Retrieve a list of upcoming Phish shows.
 * 
 * This endpoint:
 * 1. Fetches show data from the Phish.net API
 * 2. Filters for shows on or after the current date
 * 3. Formats the response data for consistency
 * 4. Supplements with database shows if API results are insufficient
 * 
 * The response includes up to 8 upcoming shows.
 */
router.get("/shows/upcoming", async (_req, res) => {
  try {
    // Use UTC date to avoid timezone issues when comparing dates
    const now = new Date();
    const currentDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )).toISOString().split('T')[0];
    
    console.log("Current UTC date for upcoming shows filter:", currentDate);
    
    // Fetch show data from Phish.net API with specific parameters
    const showsData = await fetchPhishData("/shows/artist/phish.json", {
      order_by: "showdate",
      username: "phishnet" // Use phishnet username to ensure consistent data format
    });
    
    // Filter for upcoming shows and format the first 8 results
    const upcomingShows = showsData.filter((show: any) => show.showdate >= currentDate);
    const formattedShows = upcomingShows.slice(0, 8).map((show: any) => ({
      showid: show.showid,
      showdate: show.showdate,
      venue: show.venue,
      location: `${show.city}, ${show.state}`,
      country: show.country,
    }));
    
    // If API returned fewer than 8 shows, supplement with shows from our database
    if (formattedShows.length < 8) {
      console.log(`Only found ${formattedShows.length} upcoming shows from API, adding additional shows from database`);
      
      // Get additional shows from the current tour in our database
      const tourId = 1; // Spring 2025 tour
      const dbShows = await storage.getShowsByTour(tourId);
      
      // Format database shows to match API show format and filter out duplicates
      const additionalShows = dbShows
        // Only include shows that aren't already in formattedShows
        .filter(show => !formattedShows.some(apiShow => apiShow.showid === show.show_id))
        // Format like API shows for consistency
        .map(show => ({
          showid: show.show_id,
          showdate: show.date,
          venue: show.venue,
          location: `${show.city}, ${show.state}`,
          country: show.country,
        }));
      
      // Combine API shows and database shows, limiting to 8 total
      const combinedShows = [...formattedShows, ...additionalShows].slice(0, 8);
      console.log(`Returning ${combinedShows.length} total upcoming shows`);
      
      res.json({ shows: combinedShows });
    } else {
      res.json({ shows: formattedShows });
    }
  } catch (error) {
    console.error("Error fetching upcoming shows:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/shows/details/:showId
 * 
 * Get detailed information about a specific show by its ID.
 * This endpoint retrieves show details directly from the Phish.net API.
 * 
 * @param showId - The unique identifier for the show
 */
router.get("/shows/details/:showId", async (req, res) => {
  try {
    const { showId } = req.params;
    
    // Fetch all shows from the API to search for the specific one
    const showsData = await fetchPhishData("/shows/artist/phish.json", {
      order_by: "showdate",
      username: "phishnet"
    });
    
    // Find the specific show by ID
    const show = showsData.find((s: any) => s.showid === showId);
    
    if (show) {
      // Return formatted show details
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

/**
 * GET /api/shows/recent
 * 
 * Retrieve the most recent Phish show that has occurred.
 * This endpoint is maintained for backward compatibility.
 * 
 * The response includes details about the single most recent show.
 */
router.get("/shows/recent", async (_req, res) => {
  try {
    // Use UTC date to ensure consistent date comparison
    const now = new Date();
    const currentDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )).toISOString().split('T')[0];
    
    console.log("Current UTC date for recent show filter:", currentDate);
    
    // Fetch show data from the API
    const showsData = await fetchPhishData("/shows/artist/phish.json", {
      order_by: "showdate",
      username: "phishnet"
    });
    
    // Filter for past shows and get the most recent one
    const pastShows = showsData.filter((show: any) => show.showdate < currentDate);
    const recentShow = pastShows[pastShows.length - 1];

    if (recentShow) {
      // Return formatted details for the most recent show
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

/**
 * GET /api/shows/recent/multiple
 * 
 * Retrieve multiple recent Phish shows.
 * 
 * This endpoint fetches and returns details for the 4 most recent shows.
 * Shows are sorted in reverse chronological order (newest first).
 */
router.get("/shows/recent/multiple", async (_req, res) => {
  try {
    // Use UTC date for consistent date comparison
    const now = new Date();
    const currentDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )).toISOString().split('T')[0];
    
    console.log("Current UTC date for multiple recent shows filter:", currentDate);
    
    // Fetch shows from the API
    const showsData = await fetchPhishData("/shows/artist/phish.json", {
      order_by: "showdate",
      username: "phishnet"
    });
    
    // Filter for past shows and get the 4 most recent ones
    const pastShows = showsData.filter((show: any) => show.showdate < currentDate);
    // Get the 4 most recent shows and reverse to get newest first
    const recentShows = pastShows.slice(-4).reverse();

    if (recentShows.length > 0) {
      // Format show details consistently
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

/**
 * GET /api/shows/:showId
 * 
 * Get comprehensive details for a specific show by ID with database integration.
 * 
 * This endpoint attempts to find the show in our database first, falling back to 
 * the Phish.net API if not found. When returning data from the database, additional
 * details like scoring status and tour assignment are included.
 * 
 * @param showId - The unique identifier for the show
 */
router.get("/shows/:showId", async (req, res) => {
  try {
    const { showId } = req.params;
    
    // First try to get the show from our database
    const show = await storage.getShowByShowId(showId);
    
    if (show) {
      // Return comprehensive show details from our database
      res.json({
        showid: show.show_id,
        showdate: show.date,
        venue: show.venue,
        location: `${show.city}, ${show.state}`,
        country: show.country,
        isScored: show.is_scored,
        tourId: show.tour_id
      });
    } else {
      // If not found in database, fallback to the API
      const showsData = await fetchPhishData("/shows/artist/phish.json", {
        order_by: "showdate",
        username: "phishnet"
      });
      
      // Find the show in API data
      const apiShow = showsData.find((s: any) => s.showid === showId);
      
      if (apiShow) {
        // Return API show details with default values for database-specific fields
        res.json({
          showid: apiShow.showid,
          showdate: apiShow.showdate,
          venue: apiShow.venue,
          location: `${apiShow.city}, ${apiShow.state}`,
          country: apiShow.country,
          isScored: false, // Default for API shows
          tourId: null     // Default for API shows
        });
      } else {
        res.status(404).json({ message: "Show not found" });
      }
    }
  } catch (error) {
    console.error("Error fetching show:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

/**
 * GET /api/shows/:showId/status
 * 
 * Check the status of a specific show.
 * 
 * This endpoint retrieves metadata about a show, specifically whether it has
 * been scored and what tour it belongs to.
 * 
 * @param showId - The unique identifier for the show
 */
router.get("/shows/:showId/status", async (req, res) => {
  try {
    const { showId } = req.params;
    
    // Check if show exists in our database
    const show = await storage.getShowByShowId(showId);
    
    if (show) {
      // Return status information for the show
      res.json({
        showid: show.show_id,
        isScored: show.is_scored,
        tourId: show.tour_id
      });
    } else {
      // Return default status for shows not in our database
      res.json({
        showid: showId,
        isScored: false,
        tourId: null
      });
    }
  } catch (error) {
    console.error("Error fetching show status:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;