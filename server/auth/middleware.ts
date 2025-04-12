import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to handle authentication errors
export function handleAuthErrors(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error("Authentication error:", err);
  res.status(500).json({ message: "Authentication error" });
}