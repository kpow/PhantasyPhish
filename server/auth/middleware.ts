import { Request, Response, NextFunction } from "express";
import { SessionData } from "express-session";

// Add passport property to SessionData interface
declare module "express-session" {
  interface SessionData {
    passport?: {
      user?: number;
    };
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // First check the session - if the session exists but we're not authenticated
  // this may indicate a session persistence issue
  if (req.session && req.session.passport && req.session.passport.user) {
    // If we have a session but Passport doesn't think we're authenticated,
    // let's restore the session properly
    if (!req.isAuthenticated()) {
      console.log("Session exists but user not authenticated - attempting to restore session");
      // This will re-authenticate the user based on the session
      req.login(req.session.passport.user, (err) => {
        if (err) {
          console.error("Failed to restore session:", err);
          return res.status(401).json({ message: "Session expired" });
        }
        // Successfully restored session
        return next();
      });
      return;
    }
  }
  
  // Normal authentication check
  if (req.isAuthenticated()) {
    // Extend the session expiration on activity
    if (req.session) {
      req.session.touch();
    }
    return next();
  }
  
  // User is not authenticated
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to handle authentication errors
export function handleAuthErrors(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error("Authentication error:", err);
  res.status(500).json({ message: "Authentication error" });
}