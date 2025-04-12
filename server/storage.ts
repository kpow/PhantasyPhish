import { 
  users, 
  songs, 
  shows, 
  predictions, 
  password_reset_tokens,
  type User, 
  type InsertUser,
  type UpdateUser,
  type Song, 
  type InsertSong, 
  type Show, 
  type InsertShow, 
  type Prediction, 
  type InsertPrediction,
  type PasswordResetToken,
  type InsertPasswordResetToken
} from "@shared/schema";
import { DatabaseStorage } from "./database-storage";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User>;
  updatePassword(id: number, hashedPassword: string): Promise<User>;
  verifyUserEmail(id: number): Promise<User>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: number): Promise<PasswordResetToken>;
  
  // Email verification operations
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenAsUsed(tokenId: number): Promise<EmailVerificationToken>;
  
  // Song operations
  getAllSongs(): Promise<Song[]>;
  getSong(id: number): Promise<Song | undefined>;
  getSongByName(name: string): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  
  // Show operations
  getAllShows(): Promise<Show[]>;
  getShow(id: number): Promise<Show | undefined>;
  getShowByShowId(showId: string): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  
  // Prediction operations
  getAllPredictions(): Promise<Prediction[]>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  getUserPredictions(userId: number): Promise<Prediction[]>;
  getShowPredictions(showId: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  updatePredictionScore(id: number, score: number): Promise<Prediction>;
}

// Export the database implementation of the storage interface
export const storage = new DatabaseStorage();