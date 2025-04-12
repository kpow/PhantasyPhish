import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  display_name: text("display_name"),
  password: text("password").notNull(),
  avatar_path: text("avatar_path"),
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

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  times_played: integer("times_played").default(0),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  show_id: text("show_id").notNull().unique(),
  date: text("date").notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
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

export const insertSongSchema = createInsertSchema(songs).pick({
  name: true,
  slug: true,
  times_played: true,
});

export const insertShowSchema = createInsertSchema(shows).pick({
  show_id: true,
  date: true,
  venue: true,
  city: true,
  state: true,
  country: true,
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

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof shows.$inferSelect;

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;
