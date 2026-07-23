import { PEVType } from "../types";

export enum Priority {
  PRIORITY_HIGH_ACCURACY = 100,
  PRIORITY_BALANCED_POWER_ACCURACY = 102,
  PRIORITY_LOW_POWER = 104,
  PRIORITY_NO_POWER = 105
}

export class FusedLocationProviderClient {
  private static watchId: number | null = null;
  private static intervalId: any = null;

  public static requestLocationUpdates(
    priority: Priority,
    intervalMs: number,
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: any) => void
  ): { remove: () => void } {
    let enableHighAccuracy = priority === Priority.PRIORITY_HIGH_ACCURACY;

    this.removeLocationUpdates();

    console.log(`[FusedLocationProviderClient] Requesting location updates with Priority: ${priority === Priority.PRIORITY_HIGH_ACCURACY ? 'PRIORITY_HIGH_ACCURACY' : 'LOW_POWER'}, Interval: ${intervalMs}ms. Explicitly requesting ACCESS_FINE_LOCATION (precise hardware GPS).`);

    const startTrackingWithAccuracy = (highAcc: boolean) => {
      if (navigator.geolocation) {
        // 1. Setup persistent watcher for live coordinates
        this.watchId = navigator.geolocation.watchPosition(
          onSuccess,
          (err) => {
            if (highAcc) {
              console.warn("[FusedLocationProviderClient] High accuracy watchPosition failed, falling back to standard accuracy:", err);
              // Clean up and restart with highAcc = false
              this.removeLocationUpdates();
              startTrackingWithAccuracy(false);
            } else {
              onError(err);
            }
          },
          {
            enableHighAccuracy: highAcc,
            timeout: 15000,
            maximumAge: 10000
          }
        );

        // 2. Setup interval updates to keep the beacon live
        this.intervalId = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            (err) => {
              if (highAcc) {
                console.warn("[FusedLocationProviderClient] High accuracy getCurrentPosition failed, falling back to standard accuracy:", err);
                // Clean up and restart with highAcc = false
                this.removeLocationUpdates();
                startTrackingWithAccuracy(false);
              } else {
                onError(err);
              }
            },
            {
              enableHighAccuracy: highAcc,
              timeout: 10000,
              maximumAge: 10000
            }
          );
        }, intervalMs);
      } else {
        console.error("Geolocation API is not supported by this hardware.");
      }
    };

    startTrackingWithAccuracy(enableHighAccuracy);

    return {
      remove: () => this.removeLocationUpdates()
    };
  }

  public static removeLocationUpdates(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  altitude: number; // FIXED: Added to interface
  heading: number | null; // FIXED: Added to interface
  speed: number; // in mph
  topSpeed: number; // in mph
  distance: number; // in miles
  duration: number; // in seconds
  accuracyMode: "HIGH_ACCURACY" | "LOW_POWER";
  isStationary: boolean;
  batteryLevel: number; // 0-100
  isTracking: boolean;
  wakeLockActive: boolean;
  notificationActive: boolean;
  pevType: PEVType;
}

type LocationListener = (update: LocationUpdate) => void;

class LocationService {
  private static instance: LocationService | null = null;

  // State properties
  public isTracking = false;
  public isStationary = true;
  public accuracyMode: "HIGH_ACCURACY" | "LOW_POWER" = "LOW_POWER";
  
  // Clean initialization with no hardcoded test/mock coordinates
  private lat = 0;
  private lng = 0;
  private altitude = 0; // FIXED: Added state tracking
  private heading: number | null = null; // FIXED: Added state tracking
  private speed = 0;
  private topSpeed = 0;
  private distance = 0;
  private duration = 0;
  private batteryLevel = 100;
  private pevType: PEVType = PEVType.SCOOTER;

  // System triggers and API references
  private watchId: number | null = null;
  private locationUpdateSubscription: { remove: () => void } | null = null;
  private lowPowerIntervalId: NodeJS.Timeout | null = null;
  private trackerIntervalId: NodeJS.Timeout | null = null;
  private stationaryDetectorTimeoutId: NodeJS.Timeout | null = null;
  private wakeLock: any = null; // WakeLockSentinel
  private notification: Notification | null = null;
  private wakeLockActive = false;
  private notificationActive = false;

  // Time tracker
  private lastUpdateTime: number = Date.now();
  private stationaryCheckCount = 0;

  // Observers
  private listeners: Set<LocationListener> = new Set();

  private constructor() {
    this.initBatteryTracker();
    this.fetchInitialHardwareLocation();

    // START_STICKY auto-restart simulation if service was killed/reloaded
    const isSticky = localStorage.getItem("location_service_sticky") === "true";
    if (isSticky) {
      console.log("[LocationService] Simulating START_STICKY service restart after system kill/reloaded...");
      const savedPev = (localStorage.getItem("location_service_pev_type") || PEVType.SCOOTER) as PEVType;
      setTimeout(() => {
        this.start(savedPev).catch((err) => {
          console.error("[LocationService] Failed to auto-restart sticky tracking service:", err);
        });
      }, 0);
    }
  }

  private fetchInitialHardwareLocation() {
    if (navigator.geolocation) {
      console.log("[LocationService] Fetching initial real-world GPS telemetry from device hardware...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
          console.log(`[LocationService] Successfully locked initial real-world hardware GPS coordinates: ${this.lat}, ${this.lng}`);
          this.notifyListeners();
        },
        (error) => {
          console.warn("[LocationService] Could not retrieve initial hardware location automatically. Waiting for live tracking activation:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Bind/Unbind to updates
  public addListener(listener: LocationListener): void {
    this.listeners.add(listener);
    // Send immediate current state
    listener(this.getCurrentUpdate());
  }

  public removeListener(listener: LocationListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const update = this.getCurrentUpdate();
    this.listeners.forEach((listener) => {
      try {
        listener(update);
      } catch (err) {
        console.error("LocationService listener error:", err);
      }
    });
  }

  public getCurrentUpdate(): LocationUpdate {
    return {
      lat: this.lat,
      lng: this.lng,
      altitude: this.altitude, // FIXED: Pushing to UI
      heading: this.heading, // FIXED: Pushing to UI
      speed: this.speed,
      topSpeed: this.topSpeed,
      distance: this.distance,
      duration: this.duration,
      accuracyMode: this.accuracyMode,
      isStationary: this.isStationary,
      batteryLevel: this.batteryLevel,
      isTracking: this.isTracking,
      wakeLockActive: this.wakeLockActive || !!this.wakeLock,
      notificationActive: this.notificationActive || !!this.notification,
      pevType: this.pevType,
    };
  }

  // Fetch real battery levels if supported
  private async initBatteryTracker() {
    try {
      const nav: any = navigator;
      if (nav.getBattery) {
        const battery = await nav.getBattery();
        this.batteryLevel = Math.round(battery.level * 100);
        
        battery.addEventListener("levelchange", () => {
          this.batteryLevel = Math.round(battery.level * 100);
          this.notifyListeners();
        });
      }
    } catch (e) {
      console.warn("Battery Status API not supported, using default placeholder", e);
    }
  }

  // Start Location Service
  public async start(pevType: PEVType): Promise<void> {
    if (this.isTracking) return;

    this.isTracking = true;
    this.pevType = pevType;
    this.speed = 0;
    this.topSpeed = 0;
    this.distance = 0;
    this.duration = 0;
    this.isStationary = false;
    this.lastUpdateTime = Date.now();

    // Persist sticky service flag for automatic restart if killed by the system
    localStorage.setItem("location_service_sticky", "true");
    localStorage.setItem("location_service_pev_type", pevType);

    // 1. Request Screen Wake Lock (keeps GPS awake)
    this.wakeLockActive = true;
    await this.requestWakeLock();

    // 2. Setup Persistent Browser Notification (Foreground Service)
    this.notificationActive = true;
    await this.setupForegroundNotification();

    // 3. Initiate the location tracking loop (starts in HIGH_ACCURACY to get initial lock)
    this.transitionToHighAccuracy();

    // 4. Start clock/duration ticker
    this.startClockTicker();

    this.notifyListeners();
  }

  // Stop Location Service
  public stop(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.speed = 0;
    this.wakeLockActive = false;
    this.notificationActive = false;

    // Clear sticky service flag
    localStorage.removeItem("location_service_sticky");

    // Clear trackers
    this.clearGPSWatch();
    this.clearLowPowerInterval();
    this.clearClockTicker();
    this.clearStationaryDetector();

    // Release system locks
    this.releaseWakeLock();
    this.dismissNotification();

    this.notifyListeners();
  }

  // Transitions GPS polling into high performance/high accuracy mode
  private transitionToHighAccuracy() {
    this.clearGPSWatch();
    this.clearLowPowerInterval();
    
    this.accuracyMode = "HIGH_ACCURACY";
    this.stationaryCheckCount = 0;

    if (!navigator.geolocation) {
      console.error("GPS Geolocation not supported by this browser.");
      return;
    }

    // Call the emulated FusedLocationProviderClient with PRIORITY_HIGH_ACCURACY
    // Specifying an interval of 1000ms (1 second) as requested for high frequency updates
    this.locationUpdateSubscription = FusedLocationProviderClient.requestLocationUpdates(
      Priority.PRIORITY_HIGH_ACCURACY,
      1000,
      (position) => {
        this.handleNewPosition(position);
      },
      (error) => {
        console.error("High accuracy FusedLocationProviderClient GPS error:", error);
      }
    );

    this.notifyListeners();
  }

  // Transitions GPS polling into low power mode to save battery when stationary
  private transitionToLowPower() {
    this.clearGPSWatch();
    this.clearLowPowerInterval();

    this.accuracyMode = "LOW_POWER";
    this.speed = 0; // Stationary

    // Low power GPS updates using FusedLocationProviderClient
    // Specifying an interval of 5000ms (5 seconds) as requested to keep the beacon live at high-frequency
    this.locationUpdateSubscription = FusedLocationProviderClient.requestLocationUpdates(
      Priority.PRIORITY_LOW_POWER,
      5000,
      (position) => {
        // Check if we are moving again
        let currentGpsSpeed = position.coords.speed ? position.coords.speed * 2.23694 : 0;
        if (currentGpsSpeed < 0.8) currentGpsSpeed = 0;

        if (currentGpsSpeed > 1.5) {
          // Motion detected! Re-trigger high accuracy
          this.isStationary = false;
          this.transitionToHighAccuracy();
        } else {
          this.handleNewPosition(position);
        }
      },
      (error) => {
        console.warn("Low power FusedLocationProviderClient GPS error:", error);
      }
    );

    this.notifyListeners();
  }

  // Process coordinates and calculate metrics
  private handleNewPosition(position: GeolocationPosition) {
    // FIXED: Extracting altitude and heading from the raw GPS data
    const { latitude, longitude, speed, altitude, heading } = position.coords;
    const now = Date.now();
    const elapsedSeconds = this.lastUpdateTime > 0 ? (now - this.lastUpdateTime) / 1000 : 0;
    this.lastUpdateTime = now;

    let distanceAddition = 0;
    if (this.lat !== 0 && this.lng !== 0 && elapsedSeconds > 0) {
      // Calculate Haversine distance in miles
      const R = 3958.8; // Earth's radius in miles
      const dLat = ((latitude - this.lat) * Math.PI) / 180;
      const dLon = ((longitude - this.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((this.lat * Math.PI) / 180) *
          Math.cos((latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceAddition = R * c;

      // Filter out high jump GPS noise (e.g., if distanceAddition is > 0.5 miles in 5 seconds, it's a GPS glitch)
      if (distanceAddition > 0.2 && elapsedSeconds < 10) {
        distanceAddition = 0;
      }
    }

    // Calculate speed in MPH (m/s * 2.23694 or Haversine fallback)
    let calculatedSpeed = 0;
    if (elapsedSeconds > 0 && distanceAddition > 0) {
      calculatedSpeed = (distanceAddition / (elapsedSeconds / 3600)); // miles per hour
    }

    let currentGpsSpeed = (speed !== null && speed !== undefined && speed > 0.1) ? speed * 2.23694 : calculatedSpeed;
    if (currentGpsSpeed < 0.8) currentGpsSpeed = 0; // filter stationary GPS drift noise

    // Save state
    this.lat = latitude;
    this.lng = longitude;
    this.speed = Math.round(currentGpsSpeed * 10) / 10;
    
    // FIXED: Convert altitude from meters to feet and save heading
    this.altitude = altitude ? altitude * 3.28084 : 0;
    this.heading = heading;
    
    if (this.speed > this.topSpeed) {
      this.topSpeed = this.speed;
    }

    // Accumulate distance based on speed and actual time elapsed
    if (this.isTracking && elapsedSeconds > 0) {
      if (distanceAddition > 0 && this.speed > 0.5) {
        this.distance += distanceAddition;
      } else if (this.speed > 0.5) {
        const fallbackDist = (this.speed * (elapsedSeconds / 3600));
        this.distance += fallbackDist;
      }
    }

    // ADAPTIVE GPS LOGIC: Determine stationary vs moving
    if (this.speed > 1.2) {
      if (this.isStationary) {
        this.isStationary = false;
        this.stationaryCheckCount = 0;
        this.clearStationaryDetector();
        if (this.accuracyMode === "LOW_POWER") {
          this.transitionToHighAccuracy();
        }
      }
    } else {
      // If speed remains 0 for 15 seconds, declare stationary and go to low power
      if (!this.isStationary && !this.stationaryDetectorTimeoutId) {
        this.stationaryDetectorTimeoutId = setTimeout(() => {
          this.isStationary = true;
          this.transitionToLowPower();
        }, 15000);
      }
    }

    // Sync telemetry to the server immediately if tracking is active
    this.sendTelemetryToServer();

    // Update Foreground Notification content
    this.updateNotification();

    this.notifyListeners();
  }

  // Upload live telemetry to server so family/friends can see us real-time on RiderRadar
  private async sendTelemetryToServer() {
    if (!this.isTracking) return;

    // Check if Ghost Mode is enabled
    if (localStorage.getItem("radar_ghost_mode") === "true") {
      return;
    }

    // Read stored radar screen name
    const screenName = localStorage.getItem("radar_screen_name") || "Rider_Safe";
    
    try {
      await fetch("/api/riders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "user-radar-session",
          name: screenName,
          lat: this.lat,
          lng: this.lng,
          speed: this.speed,
          pevType: this.pevType,
          battery: this.batteryLevel,
        }),
      });
    } catch (err) {
      console.warn("Telemetry synchronization deferred:", err);
    }
  }

  // Standard clock timer to accumulate riding duration
  private startClockTicker() {
    this.clearClockTicker();
    this.trackerIntervalId = setInterval(() => {
      if (!this.isTracking) return;
      this.duration += 1;
      
      // Update notifications occasionally
      if (this.duration % 5 === 0) {
        this.updateNotification();
      }
      this.notifyListeners();
    }, 1000);
  }

  // Screen Wake Lock API - keeps GPS and screen alive on mobile browsers
  private async requestWakeLock() {
    try {
      const nav: any = navigator;
      if (nav.wakeLock && nav.wakeLock.request) {
        this.wakeLock = await nav.wakeLock.request("screen");
        this.wakeLock.addEventListener("release", () => {
          this.wakeLock = null;
          this.notifyListeners();
        });
      }
    } catch (err) {
      console.warn("Screen Wake Lock API not supported or deferred:", err);
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {
        console.error("Error releasing wake lock:", e);
      }
      this.wakeLock = null;
    }
  }

  // Browser Notification Foreground Service Simulation
  private async setupForegroundNotification() {
    if (!("Notification" in window)) return;

    try {
      if (Notification.permission === "granted") {
        this.createNotification();
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          this.createNotification();
        }
      }
    } catch (err) {
      console.warn("Notification configuration ignored:", err);
    }
  }

  private createNotification() {
    try {
      this.notification = new Notification("Rural ERides Active Tracker", {
        body: "Foreground tracking service initialized. Safe rides!",
        icon: "/favicon.ico",
        silent: true,
        tag: "rural-erides-foreground-service",
      });
    } catch (e) {
      // On some mobile devices new Notification is not allowed without Service Worker registration
      console.warn("Local notification instantiation requires service worker context. Fallback active.");
    }
  }

  private updateNotification() {
    if (!this.notification) return;

    const modeLabel = this.accuracyMode === "HIGH_ACCURACY" ? "💨 HIGH ACCURACY" : "🔋 LOW POWER (STATIONARY)";
    const bodyText = `Speed: ${this.speed.toFixed(1)} MPH | Dist: ${this.distance.toFixed(2)} mi | Time: ${this.formatDuration(this.duration)} | Mode: ${modeLabel}`;
    
    try {
      // Re-create notification to refresh content (browsers replace on matching tag)
      this.notification = new Notification("Rural ERides Tracking Service", {
        body: bodyText,
        tag: "rural-erides-foreground-service",
        silent: true,
        icon: "/favicon.ico",
      });
    } catch (e) {
      // Graceful fallback
    }
  }

  private dismissNotification() {
    if (this.notification) {
      this.notification.close();
      this.notification = null;
    }
  }

  private formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
  }

  // Clear timers/watch helpers
  private clearGPSWatch() {
    if (this.locationUpdateSubscription) {
      this.locationUpdateSubscription.remove();
      this.locationUpdateSubscription = null;
    }
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private clearLowPowerInterval() {
    if (this.lowPowerIntervalId !== null) {
      clearInterval(this.lowPowerIntervalId);
      this.lowPowerIntervalId = null;
    }
  }

  private clearClockTicker() {
    if (this.trackerIntervalId !== null) {
      clearInterval(this.trackerIntervalId);
      this.trackerIntervalId = null;
    }
  }

  private clearStationaryDetector() {
    if (this.stationaryDetectorTimeoutId !== null) {
      clearTimeout(this.stationaryDetectorTimeoutId);
      this.stationaryDetectorTimeoutId = null;
    }
  }
}

export const locationService = LocationService.getInstance();