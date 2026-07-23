import { PEVType } from "../types";

/**
 * TimestampedCoordinate
 * Stores a real, physical location tracking coordinate paired with an exact high-precision timestamp.
 */
export interface TimestampedCoordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

/**
 * Entity: RideSession
 * Equivalent to @Entity(tableName = "ride_sessions") in Android Room.
 */
export interface RideSession {
  id: string; // Primary Key
  date: string; // Formatted date string
  duration: number; // in seconds
  maxSpeed: number; // in mph
  avgSpeed: number; // in mph
  distance: number; // in miles
  pevType: PEVType;
  notes?: string;
  coordinates: TimestampedCoordinate[];
}

/**
 * Android LiveData emulation in TypeScript.
 * Allows components and services to observe changes dynamically, just like lifecycle-aware LiveData.
 */
export class LiveData<T> {
  private value: T;
  private observers: Set<(val: T) => void> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  public getValue(): T {
    return this.value;
  }

  public postValue(newValue: T): void {
    this.value = newValue;
    this.notifyObservers();
  }

  public setValue(newValue: T): void {
    this.value = newValue;
    this.notifyObservers();
  }

  public observe(observer: (val: T) => void): () => void {
    this.observers.add(observer);
    observer(this.value);
    return () => {
      this.observers.delete(observer);
    };
  }

  private notifyObservers(): void {
    this.observers.forEach((observer) => {
      try {
        observer(this.value);
      } catch (err) {
        console.error("LiveData observation failure:", err);
      }
    });
  }
}

const DB_NAME = "RuralERidesRoomDatabase";
const STORE_NAME = "ride_sessions";
const DB_VERSION = 1;

/**
 * RideSessionDao
 * Equivalent to @Dao interface in Android Room.
 * Handles database transaction routing and exposes reactive LiveData query streams.
 */
export class RideSessionDao {
  private dbPromise: Promise<IDBDatabase | null>;
  private allSessionsLive = new LiveData<RideSession[]>([]);
  private fallbackCacheKey = "rural_erides_ride_sessions_cache";

  constructor() {
    this.dbPromise = this.initIndexedDB().catch((err) => {
      console.warn("Falling back to localStorage web cache for ride sessions:", err);
      return null;
    });
    this.refreshLiveQuery();
  }

  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
        };

        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };

        request.onerror = (event: any) => {
          console.warn("IndexedDB failed to initialize:", event.target.error);
          resolve(null);
        };
      } catch (err) {
        console.warn("IndexedDB is not available in this environment:", err);
        resolve(null);
      }
    });
  }

  // Reloads values into the live query observable stream
  private async refreshLiveQuery(): Promise<void> {
    try {
      const sessions = await this.getAllSessionsDirect();
      // Sort: most recent first (descending by timestamp/id/date)
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.allSessionsLive.postValue(sessions);
    } catch (e) {
      console.error("Failed to sync LiveData query from database:", e);
    }
  }

  // Direct fetch helper
  public async getAllSessionsDirect(): Promise<RideSession[]> {
    const db = await this.dbPromise;
    if (!db) {
      try {
        const cached = localStorage.getItem(this.fallbackCacheKey);
        return cached ? JSON.parse(cached) : [];
      } catch (err) {
        console.error("Failed to read from localStorage web cache:", err);
        return [];
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const result = request.result || [];
          try {
            localStorage.setItem(this.fallbackCacheKey, JSON.stringify(result));
          } catch (e) {
            console.warn("Failed to backup to localStorage web cache:", e);
          }
          resolve(result);
        };

        request.onerror = () => {
          try {
            const cached = localStorage.getItem(this.fallbackCacheKey);
            resolve(cached ? JSON.parse(cached) : []);
          } catch {
            reject(request.error);
          }
        };
      } catch (e) {
        try {
          const cached = localStorage.getItem(this.fallbackCacheKey);
          resolve(cached ? JSON.parse(cached) : []);
        } catch {
          reject(e);
        }
      }
    });
  }

  /**
   * @Query("SELECT * FROM ride_sessions")
   * Exposes a live-observed query stream of all ride sessions.
   */
  public getAllSessionsLive(): LiveData<RideSession[]> {
    return this.allSessionsLive;
  }

  /**
   * @Insert(onConflict = OnConflictStrategy.REPLACE)
   * Inserts or replaces a ride session entity in local storage.
   */
  public async insert(session: RideSession): Promise<void> {
    const db = await this.dbPromise;
    if (!db) {
      try {
        const sessions = await this.getAllSessionsDirect();
        const index = sessions.findIndex((s) => s.id === session.id);
        if (index >= 0) {
          sessions[index] = session;
        } else {
          sessions.push(session);
        }
        localStorage.setItem(this.fallbackCacheKey, JSON.stringify(sessions));
        this.refreshLiveQuery();
        return;
      } catch (err) {
        console.error("LocalStorage write failed:", err);
        throw err;
      }
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(session);

        request.onsuccess = async () => {
          try {
            const result = await this.getAllSessionsDirect();
            localStorage.setItem(this.fallbackCacheKey, JSON.stringify(result));
          } catch (e) {
            console.warn("Failed to backup to localStorage web cache:", e);
          }
          this.refreshLiveQuery();
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @Delete
   * Removes a ride session entity from local storage.
   */
  public async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    if (!db) {
      try {
        const sessions = await this.getAllSessionsDirect();
        const filtered = sessions.filter((s) => s.id !== id);
        localStorage.setItem(this.fallbackCacheKey, JSON.stringify(filtered));
        this.refreshLiveQuery();
        return;
      } catch (err) {
        console.error("LocalStorage delete failed:", err);
        throw err;
      }
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = async () => {
          try {
            const result = await this.getAllSessionsDirect();
            localStorage.setItem(this.fallbackCacheKey, JSON.stringify(result));
          } catch (e) {
            console.warn("Failed to backup to localStorage web cache:", e);
          }
          this.refreshLiveQuery();
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Emulates @Query("DELETE FROM ride_sessions")
   */
  public async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    if (!db) {
      try {
        localStorage.removeItem(this.fallbackCacheKey);
        this.refreshLiveQuery();
        return;
      } catch (err) {
        console.error("LocalStorage clearAll failed:", err);
        throw err;
      }
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          try {
            localStorage.removeItem(this.fallbackCacheKey);
          } catch (e) {
            console.warn("Failed to clear localStorage web cache:", e);
          }
          this.refreshLiveQuery();
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }
}

/**
 * AppDatabase
 * Equivalent to @Database(entities = [RideSession::class], version = 1) on Android.
 * Acts as the centralized entry point to local persistent storage.
 */
export class AppDatabase {
  private static instance: AppDatabase | null = null;
  private rideSessionDaoInstance: RideSessionDao;

  private constructor() {
    this.rideSessionDaoInstance = new RideSessionDao();
  }

  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  public rideSessionDao(): RideSessionDao {
    return this.rideSessionDaoInstance;
  }
}

export const appDatabase = AppDatabase.getInstance();
