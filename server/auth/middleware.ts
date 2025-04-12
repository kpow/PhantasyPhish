import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to capture authentication errors
export function handleAuthErrors(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err) {
    console.error("Authentication error:", err);
    return res.status(500).json({ message: "Authentication error", error: err.message });
  }
  next();
}