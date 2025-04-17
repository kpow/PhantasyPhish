/**
 * Main routes index file that consolidates all route modules into a single entry point.
 * This file imports all routes from individual route category files and registers them with the Express application.
 */
import { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "../auth/routes";
import songsRoutes from "./songs";
import showsRoutes from "./shows";
import setlistsRoutes from "./setlists";
import predictionsRoutes from "./predictions";
import adminRoutes from "./admin";
import leaderboardRoutes from "./leaderboard";
import toursRoutes from "./tours";

/**
 * Register all API routes with the Express application
 * 
 * This function serves as the central point for routing registration in the application.
 * It organizes routes into logical categories, making the codebase more maintainable.
 * 
 * @param app Express application instance
 * @returns HTTP server instance initialized with the Express app
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes - handles user registration, login, password reset, etc.
  app.use("/api/auth", authRoutes);
  
  // API routes by functional category
  // Each module handles a specific domain of the application
  app.use("/api", songsRoutes);      // Song-related operations
  app.use("/api", showsRoutes);      // Concert show information
  app.use("/api", setlistsRoutes);   // Setlist retrieval and processing
  app.use("/api", predictionsRoutes); // User prediction management
  app.use("/api", adminRoutes);      // Admin-only functionality
  app.use("/api", leaderboardRoutes); // Leaderboard and scoring
  app.use("/api", toursRoutes);      // Tour-related operations

  // Create and return HTTP server with the configured Express application
  return createServer(app);
}