import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RecentPlayer, getRecentPlayers } from '../utils/recentPlayers';

// 1. Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore with specific database ID and robust connection settings
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

export interface RealtimeInvite {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  fromPlayerAvatar: string;
  toPlayerId: string;
  roomId: string;
  playerCount: 2 | 3 | 4;
  status: 'pending' | 'accepted' | 'declined' | 'busy' | 'expired';
  createdAt: number;
}

/**
 * 4. Real-time Presence: Keep player status online and discoverable
 * Falls back cleanly to localStorage if Firebase permissions/network are offline.
 */
export async function updatePlayerPresence(playerId: string, name: string, avatar: string) {
  if (!playerId) return;
  try {
    localStorage.setItem(
      'local_presence',
      JSON.stringify({ id: playerId, name, avatar, isOnline: true, lastSeen: Date.now() })
    );
    const playerRef = doc(db, 'players', playerId);
    await setDoc(
      playerRef,
      {
        id: playerId,
        name,
        avatar,
        isOnline: true,
        lastSeen: Date.now(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    console.log('Presence update failed - offline mode');
  }
}

/**
 * Mark player offline on exit / unmount
 */
export async function setPlayerOffline(playerId: string) {
  if (!playerId) return;
  try {
    const playerRef = doc(db, 'players', playerId);
    await setDoc(playerRef, { isOnline: false, lastSeen: Date.now() }, { merge: true });
  } catch {
    console.log('Presence update failed - offline mode');
  }
}

/**
 * 5. Real-time Opponent Storage:
 * Save opponent player after match so they are permanently saved across sessions and devices
 */
export async function saveOpponentToFirestore(
  myPlayerId: string,
  opponent: { id: string; name: string; avatar?: string; isBot?: boolean }
) {
  if (!myPlayerId || !opponent.id || opponent.isBot) return;
  try {
    const opponentRef = doc(db, 'players', myPlayerId, 'recentOpponents', opponent.id);
    const existingSnap = await getDoc(opponentRef);

    let gamesPlayedWith = 1;
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      gamesPlayedWith = (data.gamesPlayedWith || 1) + 1;
    }

    await setDoc(
      opponentRef,
      {
        opponentId: opponent.id,
        name: opponent.name,
        avatar:
          opponent.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        playedAt: Date.now(),
        gamesPlayedWith,
        isOnline: true,
      },
      { merge: true }
    );
  } catch {
    console.log('Opponent save offline mode - using localStorage fallback');
  }
}

/**
 * 6. Real-time Listener for Recent Opponents:
 * Syncs saved opponents from Firestore with localStorage fallback if offline
 */
export function listenToRecentOpponents(
  myPlayerId: string,
  onUpdate: (players: RecentPlayer[]) => void
): () => void {
  if (!myPlayerId) return () => {};

  try {
    const opponentsCol = collection(db, 'players', myPlayerId, 'recentOpponents');
    const q = query(opponentsCol, orderBy('playedAt', 'desc'), limit(25));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: RecentPlayer[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: d.opponentId || docSnap.id,
            name: d.name || 'Ludo Master',
            avatar:
              d.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
            lastPlayed: d.playedAt || Date.now(),
            gamesPlayedWith: d.gamesPlayedWith || 1,
            isOnline: Boolean(d.isOnline),
          });
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      () => {
        console.log('Recent opponents listener offline - using localStorage fallback');
        onUpdate(getRecentPlayers());
      }
    );

    return unsubscribe;
  } catch {
    console.log('Recent opponents listener offline - using localStorage fallback');
    onUpdate(getRecentPlayers());
    return () => {};
  }
}

/**
 * 7. Real-Time In-Game Match Invites:
 * Send direct invite to another player via Firestore with local fallback
 */
export async function sendDirectMatchInvite(
  fromPlayer: { id: string; name: string; avatar: string },
  toPlayerId: string,
  roomId: string,
  playerCount: 2 | 3 | 4
): Promise<string> {
  const inviteId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const inviteData: RealtimeInvite = {
    id: inviteId,
    fromPlayerId: fromPlayer.id,
    fromPlayerName: fromPlayer.name,
    fromPlayerAvatar: fromPlayer.avatar,
    toPlayerId,
    roomId,
    playerCount,
    status: 'pending',
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(`local_invite_${inviteId}`, JSON.stringify(inviteData));
    const inviteRef = doc(db, 'gameInvites', inviteId);
    await setDoc(inviteRef, inviteData);
  } catch {
    console.log('Invites listener offline - will retry');
  }
  return inviteId;
}

/**
 * Listen to status of an invite sent by current user
 */
export function listenToSentInvite(
  inviteId: string,
  onStatusChange: (invite: RealtimeInvite) => void
): () => void {
  if (!inviteId) return () => {};
  try {
    const inviteRef = doc(db, 'gameInvites', inviteId);

    return onSnapshot(
      inviteRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RealtimeInvite;
          onStatusChange(data);
        }
      },
      () => {
        console.log('Invites listener offline - will retry');
      }
    );
  } catch {
    console.log('Invites listener offline - will retry');
    return () => {};
  }
}

/**
 * Listen for incoming invites addressed to current user
 */
export function listenForIncomingInvites(
  myPlayerId: string,
  onInviteReceived: (invite: RealtimeInvite) => void
): () => void {
  if (!myPlayerId) return () => {};

  try {
    const invitesCol = collection(db, 'gameInvites');
    const q = query(
      invitesCol,
      where('toPlayerId', '==', myPlayerId),
      where('status', '==', 'pending')
    );

    return onSnapshot(
      q,
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as RealtimeInvite;
            // Only accept fresh invites (created within last 30s)
            if (Date.now() - data.createdAt < 30000) {
              onInviteReceived(data);
            }
          }
        });
      },
      () => {
        console.log('Invites listener offline - will retry');
      }
    );
  } catch {
    console.log('Invites listener offline - will retry');
    return () => {};
  }
}

/**
 * Respond to an incoming match invite (accept or decline)
 */
export async function respondToMatchInvite(inviteId: string, accept: boolean) {
  if (!inviteId) return;
  try {
    const inviteRef = doc(db, 'gameInvites', inviteId);
    await setDoc(inviteRef, { status: accept ? 'accepted' : 'declined' }, { merge: true });
  } catch {
    console.log('Invites listener offline - will retry');
  }
}

/**
 * Save player shop inventory and coin/diamond balance to Firebase (with local_inventory fallback)
 */
export async function saveInventoryToFirebase(
  playerId: string,
  inventory: {
    coins: number;
    diamonds?: number;
    ownedDice: string[];
    ownedTokens: string[];
    ownedBoards?: string[];
    equippedDice: string;
    equippedToken: string;
    equippedBoard?: string;
    dailyExchangeCount?: number;
    lastExchangeDate?: string;
  },
  profileData?: {
    name?: string;
    avatar?: string;
    wins?: number;
    trophies?: number;
  }
) {
  if (!playerId) return;
  const payload: Record<string, any> = {
    id: playerId,
    coins: inventory.coins ?? 0,
    diamonds: inventory.diamonds ?? 0,
    ownedDice: inventory.ownedDice ?? ['normal'],
    ownedTokens: inventory.ownedTokens ?? ['normal'],
    ownedBoards: inventory.ownedBoards ?? ['classic'],
    equippedDice: inventory.equippedDice ?? 'normal',
    equippedToken: inventory.equippedToken ?? 'normal',
    equippedBoard: inventory.equippedBoard ?? 'classic',
    dailyExchangeCount: inventory.dailyExchangeCount ?? 0,
    lastExchangeDate: inventory.lastExchangeDate ?? '',
    hasSavedProfile: true,
  };
  if (profileData?.name) payload.name = profileData.name;
  if (profileData?.avatar) payload.avatar = profileData.avatar;
  if (typeof profileData?.wins === 'number') payload.wins = profileData.wins;
  if (typeof profileData?.trophies === 'number') payload.trophies = profileData.trophies;

  try {
    localStorage.setItem('local_inventory', JSON.stringify(payload));
  } catch {}

  try {
    const playerRef = doc(db, 'players', playerId);
    await setDoc(
      playerRef,
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    console.log('Inventory offline mode - using localStorage fallback');
  }
}

/**
 * Load player shop inventory, profile, and coin/diamond balance from Firebase
 * Falls back cleanly to localStorage 'local_inventory' if Firebase permission/network fails
 */
export async function loadInventoryFromFirebase(playerId: string) {
  if (!playerId) return null;
  try {
    const playerRef = doc(db, 'players', playerId);
    const snap = await getDoc(playerRef);
    if (snap.exists()) {
      const data = snap.data();
      try {
        localStorage.setItem('local_inventory', JSON.stringify(data));
      } catch {}
      return data;
    }
    return null;
  } catch {
    console.log('Inventory offline mode - using localStorage fallback');
    try {
      const fallbackRaw = localStorage.getItem('local_inventory');
      if (fallbackRaw) {
        const parsed = JSON.parse(fallbackRaw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }
}

/**
 * Process WhatsApp Referral Open/Install:
 * Credits +1 Diamond to referrerId ONLY when the invited friend opens/installs the game via ?ref=referrerId
 */
export async function processReferralInstall(
  referrerId: string,
  newPlayerId: string
): Promise<boolean> {
  if (!referrerId || !newPlayerId || referrerId === newPlayerId) return false;
  try {
    const claimedKey = `ludo_ref_installed_${referrerId}`;
    if (localStorage.getItem(claimedKey)) return false;

    const referrerRef = doc(db, 'players', referrerId);
    const snap = await getDoc(referrerRef);
    let currentDiamonds = 0;
    let referredUsers: string[] = [];

    if (snap.exists()) {
      const data = snap.data();
      currentDiamonds = typeof data.diamonds === 'number' ? data.diamonds : 0;
      referredUsers = Array.isArray(data.referredUsers) ? data.referredUsers : [];
    }

    if (referredUsers.includes(newPlayerId)) {
      localStorage.setItem(claimedKey, '1');
      return false;
    }

    const updatedReferred = [...referredUsers, newPlayerId].slice(-100);
    await setDoc(
      referrerRef,
      {
        id: referrerId,
        diamonds: currentDiamonds + 1,
        referredUsers: updatedReferred,
        lastReferralAt: Date.now(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    localStorage.setItem(claimedKey, '1');
    return true;
  } catch {
    console.log('Inventory offline mode - using localStorage fallback');
    return false;
  }
}

/**
 * Real-time listener for player's own document so when a friend opens their WhatsApp link,
 * the inviter immediately receives +1 Diamond in real-time
 */
export function listenToMyReferralRewards(
  myPlayerId: string,
  onRemoteUpdate: (data: {
    diamonds?: number;
    coins?: number;
    name?: string;
    avatar?: string;
    referredCount: number;
  }) => void
): () => void {
  if (!myPlayerId) return () => {};
  try {
    const playerRef = doc(db, 'players', myPlayerId);
    return onSnapshot(
      playerRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const referredUsers = Array.isArray(d.referredUsers) ? d.referredUsers : [];
          onRemoteUpdate({
            diamonds: typeof d.diamonds === 'number' ? d.diamonds : undefined,
            coins: typeof d.coins === 'number' ? d.coins : undefined,
            name: typeof d.name === 'string' ? d.name : undefined,
            avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
            referredCount: referredUsers.length,
          });
        }
      },
      () => {
        console.log('Inventory offline mode - using localStorage fallback');
      }
    );
  } catch {
    console.log('Inventory offline mode - using localStorage fallback');
    return () => {};
  }
}
