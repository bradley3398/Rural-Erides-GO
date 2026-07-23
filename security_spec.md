# Security Specification (Phase 0: Security TDD)

## 1. Data Invariants
- **UserProfile**:
  - Each profile document ID MUST be equal to the user's authenticated `uid`.
  - The payload `uid` property MUST match the authenticated `uid`.
  - Profile documents are immutable in their identity (`uid`).
  - Only the authenticated owner of the profile can read or write (create/update) that profile document.
- **RadarBeacon**:
  - Each beacon document ID MUST be equal to the user's authenticated `uid`.
  - The payload `uid` property MUST match the authenticated `uid`.
  - The `uid` in the beacon document is immutable after creation.
  - Any authenticated user can read fellow riders' beacons, but they can only write (create/update/delete) their own beacon document.

---

## 2. The "Dirty Dozen" (Malicious Payloads)

### UserProfile Attacker Vectors
1. **Identity Spoofing Profile Creation**: Attacker attempts to create a profile under another user's UID.
2. **Identity Spoofing Profile Modification**: Attacker attempts to update another user's profile information.
3. **Ghost Field Poisoning**: Attacker tries to inject a high-privilege attribute field `role: "admin"`.
4. **Unauthenticated Profile Reading**: Unauthenticated user attempts to read any profile document.
5. **Unauthorized Profile Reading**: Authenticated User A tries to read Authenticated User B's profile document.
6. **Immutable UID Modification**: Profile owner tries to change the `uid` field in their own document to take over another account's identity.

### RadarBeacon Attacker Vectors
7. **Beacon Hijacking (Create)**: Attacker attempts to create a beacon with a document ID of another rider's UID.
8. **Beacon Hijacking (Update)**: Attacker attempts to update coordinates or vehicle fields in another rider's beacon document.
9. **UID Field Poisoning**: Attacker attempts to change the `uid` of their beacon to another user's UID to spoof their identity on the map.
10. **Unauthenticated Radar Scan**: Unauthenticated client attempts to query the `radar` collection.
11. **Excessive Coordinate Length**: Attacker attempts to inject custom scripts inside display name strings (`name: "<script>...</script>"`).
12. **Malicious Beacon Deletion**: User A attempts to delete User B's beacon to make them disappear from the map.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ruralerides-test-proj',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Rules Security Tests', () => {
  // Profiles Tests
  test('User can read own profile', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(aliceDb, 'profiles/alice')));
  });

  test('User cannot read other profile', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(aliceDb, 'profiles/bob')));
  });

  test('User can write own profile with valid data', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(aliceDb, 'profiles/alice'), {
      uid: 'alice',
      name: 'Alice Rider',
      email: 'alice@example.com'
    }));
  });

  test('User cannot write own profile with invalid schema or mismatched UID', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(aliceDb, 'profiles/alice'), {
      uid: 'bob', // Mismatch!
      name: 'Alice Rider',
      email: 'alice@example.com'
    }));
  });

  // Radar Tests
  test('User can read other beacons', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(aliceDb, 'radar/bob')));
  });

  test('User can update own beacon coordinates', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(aliceDb, 'radar/alice'), {
      uid: 'alice',
      lat: 35.4676,
      lng: -97.5164,
      name: 'Alice Rider',
      pevType: 'E-Bike'
    }));
  });

  test('User cannot update other beacon coordinates', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(updateDoc(doc(aliceDb, 'radar/bob'), {
      lat: 40.0,
      lng: -80.0
    }));
  });
});
```
