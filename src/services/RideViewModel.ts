import { PEVType } from "../types";
import { appDatabase, RideSession, LiveData, TimestampedCoordinate } from "../db/AppDatabase";
import { locationService, LocationUpdate } from "./LocationService";

/**
 * RideViewModel
 * Bridges the UI controllers (Views) with the Room Database (Models) and GPS trackers (Services).
 * Implements standard LiveData observers to stream synchronized ride sessions and live coordinates.
 */
class RideViewModel {
  private static instance: RideViewModel | null = null;

  // LiveData stream of saved sessions directly from the Room Dao
  public savedRides: LiveData<RideSession[]>;

  // LiveData representing the currently active, uncommitted ride
  public activeSession: LiveData<RideSession | null> = new LiveData<RideSession | null>(null);

  // Buffer state to compute accurate live metrics
  private trackedCoordinates: TimestampedCoordinate[] = [];
  private totalSpeedPoints = 0;
  private sumOfSpeeds = 0;

  private constructor() {
    this.savedRides = appDatabase.rideSessionDao().getAllSessionsLive();

    // Subscribe to low-level GPS Location Service
    locationService.addListener((update: LocationUpdate) => {
      this.handleLocationUpdate(update);
    });

    // Run Firestore synchronization on startup
    this.syncRides();
  }

  public static getInstance(): RideViewModel {
    if (!RideViewModel.instance) {
      RideViewModel.instance = new RideViewModel();
    }
    return RideViewModel.instance;
  }

  /**
   * Process incoming GPS coordinates and update active ride metrics reactively
   */
  private handleLocationUpdate(update: LocationUpdate): void {
    if (!update.isTracking) {
      // Clear active tracking states if the system isn't running
      if (this.activeSession.getValue() !== null) {
        this.activeSession.setValue(null);
      }
      this.trackedCoordinates = [];
      this.totalSpeedPoints = 0;
      this.sumOfSpeeds = 0;
      return;
    }

    // Capture physical location if we have departed from the initial static coordinates
    const isStaticDefault = update.lat === 0 && update.lng === 0;
    if (!isStaticDefault) {
      const lastPoint = this.trackedCoordinates[this.trackedCoordinates.length - 1];
      if (!lastPoint || lastPoint.lat !== update.lat || lastPoint.lng !== update.lng) {
        this.trackedCoordinates.push({
          lat: update.lat,
          lng: update.lng,
          timestamp: Date.now(),
        });
      }
    }

    // Accumulate non-zero speed values for a true average speed calculation
    if (update.speed > 0.2) {
      this.totalSpeedPoints += 1;
      this.sumOfSpeeds += update.speed;
    }

    const computedAvgSpeed = this.totalSpeedPoints > 0
      ? Math.round((this.sumOfSpeeds / this.totalSpeedPoints) * 10) / 10
      : 0;

    // Create a live RideSession representation
    const currentSession: RideSession = {
      id: "active-ride-session",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      duration: update.duration,
      maxSpeed: update.topSpeed,
      avgSpeed: Math.min(computedAvgSpeed, update.topSpeed),
      distance: update.distance,
      pevType: update.pevType,
      coordinates: [...this.trackedCoordinates],
    };

    this.activeSession.setValue(currentSession);
  }

  /**
   * Triggers the GPS background tracker
   */
  public startTracking(pevType: PEVType): void {
    this.trackedCoordinates = [];
    this.totalSpeedPoints = 0;
    this.sumOfSpeeds = 0;
    locationService.start(pevType);
  }

  /**
   * Stops the active tracking service
   */
  public stopTracking(): void {
    locationService.stop();
  }

  /**
   * Fetch all ride logs from Firestore and synchronize them into IndexedDB (Room Emulation)
   */
  public async syncRides(): Promise<void> {
    try {
      const res = await fetch("/api/rides");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rides)) {
          // Fetch all local keys to avoid redundant writes
          const localRides = await appDatabase.rideSessionDao().getAllSessionsDirect();
          const localIds = new Set(localRides.map(r => r.id));
          
          for (const serverRide of data.rides) {
            if (!localIds.has(serverRide.id)) {
              await appDatabase.rideSessionDao().insert(serverRide);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[RideViewModel] Ride synchronization deferred due to network:", err);
    }
  }

  /**
   * Persists the live ride session to our IndexedDB Room Database and syncs to Firestore
   */
  public async saveCurrentRide(notes?: string): Promise<void> {
    const liveSession = this.activeSession.getValue();
    if (!liveSession) return;

    // Build the concrete Room Entity instance
    const roomEntity: RideSession = {
      ...liveSession,
      id: "ride_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      notes: notes || "Rural e-ride completed.",
    };

    // Insert into Room
    await appDatabase.rideSessionDao().insert(roomEntity);

    // Stop tracking service
    locationService.stop();

    // Sync to Firestore
    try {
      await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomEntity),
      });
    } catch (err) {
      console.warn("[RideViewModel] Could not sync ride log to Firestore:", err);
    }
  }

  /**
   * Removes a ride from local storage and Firestore
   */
  public async deleteRide(id: string): Promise<void> {
    await appDatabase.rideSessionDao().delete(id);
    try {
      await fetch(`/api/rides/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("[RideViewModel] Could not delete ride log from Firestore:", err);
    }
  }

  /**
   * Clear Room Database and Firestore entirely
   */
  public async clearAllRides(): Promise<void> {
    try {
      const localRides = await appDatabase.rideSessionDao().getAllSessionsDirect();
      await appDatabase.rideSessionDao().clearAll();
      for (const ride of localRides) {
        await fetch(`/api/rides/${ride.id}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("[RideViewModel] Could not clear all ride logs from Firestore:", err);
    }
  }
}

export const rideViewModel = RideViewModel.getInstance();
