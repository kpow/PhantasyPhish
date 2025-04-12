import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  username: true,
  password: true,
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
export type User = typeof users.$inferSelect;

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof shows.$inferSelect;

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;
