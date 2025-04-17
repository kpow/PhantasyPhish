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
 * Register all API routes
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes
  app.use("/api/auth", authRoutes);
  
  // Register API routes by category
  app.use("/api", songsRoutes);
  app.use("/api", showsRoutes);
  app.use("/api", setlistsRoutes);
  app.use("/api", predictionsRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", leaderboardRoutes);
  app.use("/api", toursRoutes);

  // Create and return HTTP server
  return createServer(app);
}