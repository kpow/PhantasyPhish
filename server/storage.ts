import { users, songs, shows, predictions, type User, type InsertUser, type Song, type InsertSong, type Show, type InsertShow, type Prediction, type InsertPrediction } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private songs: Map<number, Song>;
  private shows: Map<number, Show>;
  private predictions: Map<number, Prediction>;
  
  private currentUserId: number;
  private currentSongId: number;
  private currentShowId: number;
  private currentPredictionId: number;

  constructor() {
    this.users = new Map();
    this.songs = new Map();
    this.shows = new Map();
    this.predictions = new Map();
    
    this.currentUserId = 1;
    this.currentSongId = 1;
    this.currentShowId = 1;
    this.currentPredictionId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Song methods
  async getAllSongs(): Promise<Song[]> {
    return Array.from(this.songs.values());
  }
  
  async getSong(id: number): Promise<Song | undefined> {
    return this.songs.get(id);
  }
  
  async getSongByName(name: string): Promise<Song | undefined> {
    return Array.from(this.songs.values()).find(
      (song) => song.name === name,
    );
  }
  
  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = this.currentSongId++;
    const song: Song = { ...insertSong, id };
    this.songs.set(id, song);
    return song;
  }
  
  // Show methods
  async getAllShows(): Promise<Show[]> {
    return Array.from(this.shows.values());
  }
  
  async getShow(id: number): Promise<Show | undefined> {
    return this.shows.get(id);
  }
  
  async getShowByShowId(showId: string): Promise<Show | undefined> {
    return Array.from(this.shows.values()).find(
      (show) => show.show_id === showId,
    );
  }
  
  async createShow(insertShow: InsertShow): Promise<Show> {
    const id = this.currentShowId++;
    const show: Show = { ...insertShow, id };
    this.shows.set(id, show);
    return show;
  }
  
  // Prediction methods
  async getAllPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictions.values());
  }
  
  async getPrediction(id: number): Promise<Prediction | undefined> {
    return this.predictions.get(id);
  }
  
  async getUserPredictions(userId: number): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(
      (prediction) => prediction.user_id === userId,
    );
  }
  
  async getShowPredictions(showId: string): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(
      (prediction) => prediction.show_id === showId,
    );
  }
  
  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = this.currentPredictionId++;
    const prediction: Prediction = { 
      ...insertPrediction, 
      id, 
      created_at: new Date(),
      score: null 
    };
    this.predictions.set(id, prediction);
    return prediction;
  }
  
  async updatePredictionScore(id: number, score: number): Promise<Prediction> {
    const prediction = this.predictions.get(id);
    if (!prediction) {
      throw new Error(`Prediction with id ${id} not found`);
    }
    
    const updatedPrediction = { ...prediction, score };
    this.predictions.set(id, updatedPrediction);
    return updatedPrediction;
  }
}

export const storage = new MemStorage();
