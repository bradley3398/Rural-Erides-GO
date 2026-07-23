import express from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';

// ==========================================
// 1. FIREBASE CLOUD CONNECTION (Configured for rural-erides-go)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCbqZRoqq6xKsjHmr0062Gn_LJ87zXJVZA",
  authDomain: "rural-erides-go.firebaseapp.com",
  projectId: "rural-erides-go",
  storageBucket: "rural-erides-go.firebasestorage.app",
  messagingSenderId: "1030367232900",
  appId: "1:1030367232900:android:9a6609ac72bff861c993d1"
};

// Ignite Firebase inside the server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ==========================================
// 2. SERVER SETUP & SECURITY
// ==========================================
const app = express();
const PORT = process.env.PORT || 3001; 

app.use(cors());
app.use(express.json());

// --- HARDENED MODERATION FILTER ---
const DISALLOWED_KEYWORDS = [
  "abuse", "idiot", "jerk", "asshole", "bitch", "crap", "damn", "fuck", 
  "shit", "bastard", "nigger", "faggot", "trash", "hate", "kill", "stupid", 
  "moron", "dumb", "spam", "scam", "reckless", "illegal", "drunk", "high"
];

const checkContentSafety = (text: string) => {
  const normalized = text.toLowerCase();
  for (const word of DISALLOWED_KEYWORDS) {
    if (normalized.includes(word)) return { safe: false, word };
  }
  return { safe: true };
};

// ==========================================
// 3. RIDER TELEMETRY ROUTES
// ==========================================

app.get('/api/riders', async (req, res) => {
  try {
    const ridersRef = collection(db, "radar_riders");
    const snapshot = await getDocs(ridersRef);
    const activeRiders: any[] = [];
    const now = Date.now();

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (now - data.lastUpdated < 120000) {
        activeRiders.push({ id: docSnap.id, ...data });
      } else {
        deleteDoc(doc(db, "radar_riders", docSnap.id)).catch(() => {});
      }
    });

    res.json({ riders: activeRiders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch riders from cloud." });
  }
});

app.post('/api/riders/update', async (req, res) => {
  const { id, name, lat, lng, speed, pevType, battery } = req.body;
  
  const safety = checkContentSafety(name || "");
  if (!safety.safe) return res.status(400).json({ error: `Username rejected: ${safety.word}` });

  try {
    const docRef = doc(db, "radar_riders", id);
    if (lat === 0 && lng === 0) {
      await deleteDoc(docRef);
      return res.json({ success: true, status: "Ghost mode activated." });
    }
    await setDoc(docRef, { name, lat, lng, speed, pevType, battery, lastUpdated: Date.now() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Cloud sync failed." });
  }
});

// ==========================================
// 4. MEETUP COORDINATION ROUTES
// ==========================================

app.get('/api/meetups', async (req, res) => {
  try {
    const docSnap = await getDocs(collection(db, "radar_meetups"));
    let activeMeetup = null;
    docSnap.forEach(d => { if (d.id === "active") activeMeetup = d.data(); });
    res.json({ meetup: activeMeetup });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch meetup." });
  }
});

app.post('/api/meetups', async (req, res) => {
  const { lat, lng, description, setBy } = req.body;
  const safety = checkContentSafety(description || "");
  if (!safety.safe) return res.status(400).json({ error: `Meetup rejected: ${safety.word}` });

  try {
    const newMeetup = { lat, lng, description, setBy, timestamp: Date.now() };
    await setDoc(doc(db, "radar_meetups", "active"), newMeetup);
    res.json({ success: true, meetup: newMeetup });
  } catch (error) {
    res.status(500).json({ error: "Failed to deploy pin to cloud." });
  }
});

// ==========================================
// 5. BROADCAST PING ROUTES
// ==========================================

app.get('/api/pings', async (req, res) => {
  try {
    const pingsRef = collection(db, "radar_pings");
    const q = query(pingsRef, orderBy("timestamp", "desc"), limit(15));
    const snapshot = await getDocs(q);
    const recentPings: any[] = [];
    snapshot.forEach(docSnap => recentPings.push({ id: docSnap.id, ...docSnap.data() }));
    res.json({ pings: recentPings });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pings." });
  }
});

app.post('/api/pings', async (req, res) => {
  const { sender, message, lat, lng } = req.body;
  const safety = checkContentSafety(message || "");
  if (!safety.safe) return res.status(400).json({ error: `Broadcast rejected: ${safety.word}` });

  try {
    const newPing = { sender, message, lat, lng, timestamp: Date.now() };
    const docRef = await addDoc(collection(db, "radar_pings"), newPing);
    res.json({ success: true, ping: { id: docRef.id, ...newPing } });
  } catch (error) {
    res.status(500).json({ error: "Failed to broadcast signal to cloud." });
  }
});

// --- IGNITION ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================`);
  console.log(`🚀 RURAL ERIDES ENGINE ONLINE`);
  console.log(`☁️  Connected to Firebase Cloud Database`);
  console.log(`📡 Listening for telemetry on Port ${PORT}`);
  console.log(`======================================\n`);
});