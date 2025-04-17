import express, { Request, Response } from "express";
import { storage } from "../storage";
import { insertPredictionSchema } from "@shared/schema";
import { scorePrediction } from "../utils/scoring-utils";
import { isAuthenticated } from "../auth/middleware";
import { z } from "zod";

const router = express.Router();

// Save a prediction
router.post("/predictions", async (req, res) => {
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
      try {
        // Validate the prediction data using the schema
        const validatedData = insertPredictionSchema.parse({
          user_id: userId,
          show_id: show_id,
          setlist: setlist,
          score: 0 // Default score of 0 for new predictions
        });
        
        savedPrediction = await storage.createPrediction(validatedData);
        res.status(201).json({ 
          message: "Prediction created successfully", 
          prediction: savedPrediction,
          created: true
        });
      } catch (error) {
        console.error("Error creating prediction:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Invalid prediction data", 
            errors: error.errors 
          });
        }
        return res.status(500).json({ message: "Failed to create prediction" });
      }
    }
  } catch (error) {
    console.error("Error saving prediction:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get user predictions
router.get("/users/:userId/predictions", async (req, res) => {
  try {
    const { userId } = req.params;
    const predictions = await storage.getUserPredictions(parseInt(userId));
    res.json({ predictions });
  } catch (error) {
    console.error("Error fetching user predictions:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get current user's prediction for a specific show
router.get("/users/current/predictions/:showId", async (req, res) => {
  try {
    // Make sure user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = (req.user as { id: number }).id;
    const { showId } = req.params;
    
    // Get user's predictions
    const predictions = await storage.getUserPredictions(userId);
    
    // Find prediction for specific show
    const prediction = predictions.find(p => String(p.show_id) === String(showId));
    
    if (prediction) {
      res.json({ prediction });
    } else {
      res.status(404).json({ message: "Prediction not found" });
    }
  } catch (error) {
    console.error("Error fetching user prediction for show:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Delete current user's prediction for a specific show
router.delete("/users/current/predictions/:showId", async (req, res) => {
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
      res.json({ success: true, message: "Prediction deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Prediction not found" });
    }
  } catch (error) {
    console.error("Error deleting prediction:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// Test scoring for predictions (for frontend testing/debugging)
router.post("/test/score", async (req, res) => {
  try {
    // Handle both naming conventions (actual and actualSetlist)
    const { prediction, actual, actualSetlist } = req.body;
    
    // Use actualSetlist if provided, otherwise use actual
    const setlistToScore = actualSetlist || actual;
    
    if (!prediction || !setlistToScore) {
      return res.status(400).json({ message: "Missing prediction or actual setlist data" });
    }
    
    // Score the prediction
    const scoringResult = scorePrediction(prediction, setlistToScore);
    
    // Return the result matching the client's expected format
    res.json({
      score: scoringResult.totalScore,  // Add total score at the top level for the toast
      breakdown: scoringResult          // Include the full breakdown for the scoring card
    });
  } catch (error) {
    console.error("Error scoring test prediction:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Score a prediction (used when admin scores a show)
router.post("/predictions/:predictionId/score", async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { score } = req.body;
    
    if (typeof score !== 'number') {
      return res.status(400).json({ message: "Invalid score format" });
    }
    
    // Update the prediction score
    const updated = await storage.updatePredictionScore(parseInt(predictionId), score);
    
    res.json({ 
      message: "Prediction score updated", 
      prediction: updated 
    });
  } catch (error) {
    console.error("Error updating prediction score:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;