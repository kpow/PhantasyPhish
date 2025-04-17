import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  display_name: text("display_name"),
  password: text("password").notNull(),
  avatar_path: text("avatar_path"),
  email_verified: boolean("email_verified").default(false),
  is_admin: boolean("is_admin").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const password_reset_tokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const email_verification_tokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  times_played: integer("times_played").default(0),
});

export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  show_id: text("show_id").notNull().unique(),
  date: text("date").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  tour_id: integer("tour_id").references(() => tours.id),
  is_scored: boolean("is_scored").default(false),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  show_id: text("show_id").notNull(),
  setlist: jsonb("setlist").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  score: integer("score"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  display_name: true,
  password: true,
  avatar_path: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  display_name: true,
  avatar_path: true,
}).partial();

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertPasswordResetTokenSchema = createInsertSchema(password_reset_tokens).pick({
  user_id: true,
  token: true,
  expires_at: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(email_verification_tokens).pick({
  user_id: true,
  token: true,
  expires_at: true,
});

export const insertSongSchema = createInsertSchema(songs).pick({
  name: true,
  slug: true,
  times_played: true,
});

export const insertTourSchema = createInsertSchema(tours).pick({
  name: true,
  start_date: true,
  end_date: true,
  description: true,
});

export const insertShowSchema = createInsertSchema(shows).pick({
  show_id: true,
  date: true,
  venue: true,
  city: true,
  state: true,
  country: true,
  tour_id: true,
  is_scored: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).pick({
  user_id: true,
  show_id: true,
  setlist: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type User = typeof users.$inferSelect;
export type Login = z.infer<typeof loginSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof password_reset_tokens.$inferSelect;

export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type EmailVerificationToken = typeof email_verification_tokens.$inferSelect;

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;

export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof shows.$inferSelect;

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

// Site configuration table for storing application settings
export const site_config = pgTable("site_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Schema for inserting a site configuration entry
export const insertSiteConfigSchema = createInsertSchema(site_config).pick({
  key: true,
  value: true,
});

// Types for site configuration
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type SiteConfig = typeof site_config.$inferSelect;
