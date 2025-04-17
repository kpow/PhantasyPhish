/**
 * Main Routes Entry Point
 * 
 * This file has been refactored to use modular route organization.
 * For the actual routes implementation, see the files in the server/routes directory.
 * 
 * This refactoring improves code organization, maintainability, and readability
 * by separating routes into logical modules based on functionality.
 */
import type { Express } from "express";
import { registerRoutes as registerModularRoutes } from "./routes/index";

/**
 * Register all routes with the Express application
 * 
 * This function has been simplified to delegate to the modular routes system.
 * All route implementation details are now in the server/routes directory.
 * 
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express) {
  // Use the modular routes system
  return await registerModularRoutes(app);
}
