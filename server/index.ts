import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import fs from "fs";
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import passport, { configurePassport } from "./auth/passport";
import { setupEmailTransporter } from "./auth/email";
import { runMigrations, checkDatabaseTables } from "./database";

const { Pool } = pg;

// Create uploads directory for avatars
const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure PostgreSQL session store
const PgSession = connectPgSimple(session);
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure session
app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "phish-setlist-predictor-secret",
    resave: true, // Save the session even if it's not modified
    saveUninitialized: true, // Save new sessions that haven't been modified
    rolling: true, // Force a cookie set on every response
    cookie: {
      // In production, we'll trust the proxy and allow non-secure cookies
      // This is necessary for Replit's deployment environment
      secure: false, // Don't require HTTPS for cookies to work
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax', // Allow cross-site requests with top-level navigation
      httpOnly: true, // Prevent client-side JS from reading the cookie
      path: '/',
    },
    name: 'phish.sid', // Custom name to avoid default 'connect.sid'
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Only run migrations automatically in development mode
    // or if RUN_MIGRATIONS environment variable is set
    if (app.get("env") === "development" || process.env.RUN_MIGRATIONS === "true") {
      await runMigrations();
      log("Database migrations completed successfully");
    } else {
      log("Skipping automatic migrations in production. Set RUN_MIGRATIONS=true to run them");
      // In production, just check that the tables exist without running migrations
      const allTablesExist = await checkDatabaseTables();
      if (!allTablesExist) {
        log("WARNING: Some required database tables are missing. Consider running migrations");
      }
    }
  } catch (error) {
    log("Error with database setup: " + error);
  }

  // Configure Passport authentication
  configurePassport();
  log("Passport authentication configured");

  // Set up email transporter if credentials are available
  if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    await setupEmailTransporter(process.env.GMAIL_USER, process.env.GMAIL_PASSWORD);
    log("Email transporter configured");
  } else {
    log("WARNING: Gmail credentials not provided. Password reset emails will not be sent.");
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
