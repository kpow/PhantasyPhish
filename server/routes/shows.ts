import express from "express";
import { storage } from "../storage";
import { fetchPhishData } from "../utils/api-utils";

const router = express.Router();

// Get upcoming shows
router.get("/shows/upcoming", async (_req, res) => {
  try {
    // Use UTC date to avoid timezone issues
    const now = new Date();
    const currentDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )).toISOString().split('T')[0];
    
    console.log("Current UTC date for upcoming shows filter:", currentDate);
    
    // Add username: "phishnet" parameter to avoid using koolyp data
    const showsData = await fetchPhishData("/shows/artist/phish.json", {
      order_by: "showdate",
      username: "phishnet"
    });
    
    const upcomingShows = showsData.filter((show: any) => show.showdate >= currentDate);
    const formattedShows = upcomingShows.slice(0, 8).map((show: any) => ({
      showid: show.showid,
      showdate: show.showdate,
      venue: show.venue,
      location: `${show.city}, ${show.state}`,
      country: show.country,
    }));
    
    // If we have less than 8 shows from the API, pull additional shows from our database
    if (formattedShows.length < 8) {
      console.log(`Only found ${formattedShows.length} upcoming shows from API, adding additional shows from database`);
      
      // Get the tour shows from our database
      const tourId = 1; // Spring 2025 tour
      const dbShows = await storage.getShowsByTour(tourId);
      
      // Convert to the same format as API shows
      const additionalShows = dbShows
        // Only include shows that aren't already in formattedShows
        .filter(show => !formattedShows.some(apiShow => apiShow.showid === show.show_id))
        // Format like API shows
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

// Get details for a specific show by ID
router.get("/shows/details/:showId", async (req, res) => {
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
router.get("/shows/recent", async (_req, res) => {
  try {
    // Use UTC date to avoid timezone issues
    const now = new Date();
    const currentDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )).toISOString().split('T')[0];
    
    console.log("Current UTC date for recent show filter:", currentDate);
    
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
router.get("/shows/recent/multiple", async (_req, res) => {
  try {
    // Use UTC date to avoid timezone issues
    const now = new Date();
    const currentDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )).toISOString().split('T')[0];
    
    console.log("Current UTC date for multiple recent shows filter:", currentDate);
    
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

// Get details for a specific show by ID
router.get("/shows/:showId", async (req, res) => {
  try {
    const { showId } = req.params;
    // First try to get from storage
    const show = await storage.getShowByShowId(showId);
    
    if (show) {
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
      // If not found in storage, try to get from API
      const showsData = await fetchPhishData("/shows/artist/phish.json", {
        order_by: "showdate",
        username: "phishnet"
      });
      
      const apiShow = showsData.find((s: any) => s.showid === showId);
      
      if (apiShow) {
        res.json({
          showid: apiShow.showid,
          showdate: apiShow.showdate,
          venue: apiShow.venue,
          location: `${apiShow.city}, ${apiShow.state}`,
          country: apiShow.country,
          isScored: false,
          tourId: null
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

// Get show status (whether it's scored, tour, etc.)
router.get("/shows/:showId/status", async (req, res) => {
  try {
    const { showId } = req.params;
    const show = await storage.getShowByShowId(showId);
    
    if (show) {
      res.json({
        showid: show.show_id,
        isScored: show.is_scored,
        tourId: show.tour_id
      });
    } else {
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