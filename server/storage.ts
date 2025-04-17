import { 
  users, 
  songs, 
  shows,
  tours, 
  predictions, 
  password_reset_tokens,
  email_verification_tokens,
  type User, 
  type InsertUser,
  type UpdateUser,
  type Song, 
  type InsertSong,
  type Tour,
  type InsertTour, 
  type Show, 
  type InsertShow, 
  type Prediction, 
  type InsertPrediction,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailVerificationToken,
  type InsertEmailVerificationToken
} from "@shared/schema";
import { DatabaseStorage } from "./database-storage";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
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
  
  // Tour operations
  getAllTours(): Promise<Tour[]>;
  getTour(id: number): Promise<Tour | undefined>;
  getTourByName(name: string): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  
  // Show operations
  getAllShows(): Promise<Show[]>;
  getShow(id: number): Promise<Show | undefined>;
  getShowByShowId(showId: string): Promise<Show | undefined>;
  getShowsByTour(tourId: number): Promise<Show[]>;
  createShow(show: InsertShow): Promise<Show>;
  updateShowScoredStatus(showId: string, isScored: boolean): Promise<Show | undefined>;
  updateShowTour(showId: string, tourId: number): Promise<Show | undefined>;
  
  // Prediction operations
  getAllPredictions(): Promise<Prediction[]>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  getUserPredictions(userId: number): Promise<Prediction[]>;
  getShowPredictions(showId: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  updatePredictionScore(id: number, score: number): Promise<Prediction>;
  deletePredictionByUserAndShow(userId: number, showId: string): Promise<boolean>;
  
  // Leaderboard operations
  getLeaderboardForShow(showId: string): Promise<{userId: number, userName: string, score: number}[]>;
  getLeaderboardForTour(tourId: number): Promise<{userId: number, userName: string, totalScore: number, showsParticipated: number}[]>;
  getUserScoreForTour(userId: number, tourId: number): Promise<{totalScore: number, showsParticipated: number}>;
  scoreAllPredictionsForShow(showId: string): Promise<{processed: number, updated: number, errors: number}>;
  getGlobalLeaderboard(limit?: number): Promise<{userId: number, userName: string, totalScore: number, showsParticipated: number}[]>;
}

// Export the database implementation of the storage interface
export const storage = new DatabaseStorage();