import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import { appCache } from './cache';
import {
  GlobalSettings,
  Product,
  Order,
  RechargeRecord,
  WithdrawRecord,
  NotificationItem,
  AnnouncementItem,
  UserData,
  TeamCounts
} from '../types';

export const DEFAULT_SETTINGS: GlobalSettings = {
  upiId: 'admin@upi',
  upiIds: ['admin@upi'],
  noticeMsg: '',
  withdrawSwitch: true,
  minRecharge: 200,
  minWithdraw: 200,
  withdrawTax: 10,
  tier1: 50,
  tier2: 9,
  tier3: 1
};

export const DEFAULT_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    category: 'stable',
    title: '0 Purchase upgrade to VIP1',
    daily: '25.00',
    duration: 60,
    durationValue: 60,
    durationUnit: 'days',
    price: '280.00',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'
  },
  {
    category: 'stable',
    title: '1 Purchase upgrade to VIP2',
    daily: '232.00',
    duration: 49,
    durationValue: 49,
    durationUnit: 'days',
    price: '1000.00',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80'
  },
  {
    category: 'welfare',
    title: '1 Welfare Bonus',
    daily: '100.00',
    duration: 1,
    durationValue: 1,
    durationUnit: 'days',
    price: '200.00',
    image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&w=300&q=80'
  }
];

// Helper to chunk array for Firestore 'in' queries (max 30 elements per query)
function chunkArray<T>(arr: T[], size: number = 30): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// 1. GLOBAL SETTINGS (CACHED)
export async function getGlobalSettings(forceRefresh = false): Promise<GlobalSettings> {
  const cacheKey = 'globalSettings';
  if (!forceRefresh) {
    const cached = appCache.get<GlobalSettings>(cacheKey);
    if (cached) return cached;
  }

  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    let data: GlobalSettings = { ...DEFAULT_SETTINGS };
    if (snap.exists()) {
      data = { ...data, ...(snap.data() as Partial<GlobalSettings>) };
      if (!data.upiIds || !Array.isArray(data.upiIds) || data.upiIds.length === 0) {
        data.upiIds = [data.upiId || 'admin@upi'];
      }
    }
    appCache.set(cacheKey, data, 5 * 60 * 1000); // 5 min TTL
    return data;
  } catch (err) {
    console.warn('Failed to load settings from DB, using fallback', err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<void> {
  await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
  appCache.invalidatePattern('globalSettings');
}

// 2. PRODUCTS (CACHED)
export async function getProducts(forceRefresh = false): Promise<Product[]> {
  const cacheKey = 'products';
  if (!forceRefresh) {
    const cached = appCache.get<Product[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      // Seed default products
      const seeded: Product[] = [];
      for (const p of DEFAULT_PRODUCTS) {
        const ref = await addDoc(collection(db, 'products'), p);
        seeded.push({ id: ref.id, ...p });
      }
      appCache.set(cacheKey, seeded, 10 * 60 * 1000);
      return seeded;
    }

    const products: Product[] = [];
    snap.forEach((d) => products.push({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
    appCache.set(cacheKey, products, 10 * 60 * 1000);
    return products;
  } catch (err) {
    console.error('Error fetching products', err);
    return [];
  }
}

// 3. OPTIMIZED BATCHED DOWNLINE TEAM CALCULATOR (FIX FOR N+1 EXPLOSION)
export async function getTeamCounts(uid: string, forceRefresh = false): Promise<TeamCounts> {
  const cacheKey = `teamStats:${uid}`;
  if (!forceRefresh) {
    const cached = appCache.get<TeamCounts>(cacheKey);
    if (cached) return cached;
  }

  try {
    // Level 1: Users who were invited directly by this user
    const q1 = query(collection(db, 'users'), where('invitedBy', '==', uid));
    const snap1 = await getDocs(q1);
    const lv1Ids: string[] = [];
    snap1.forEach((d) => lv1Ids.push(d.id));

    if (lv1Ids.length === 0) {
      const counts: TeamCounts = { lv1: 0, lv2: 0, lv3: 0 };
      appCache.set(cacheKey, counts, 3 * 60 * 1000);
      return counts;
    }

    // Level 2: Batch query in groups of 30 parent IDs
    const lv1Chunks = chunkArray(lv1Ids, 30);
    const lv2Ids: string[] = [];
    for (const chunk of lv1Chunks) {
      const q2 = query(collection(db, 'users'), where('invitedBy', 'in', chunk));
      const snap2 = await getDocs(q2);
      snap2.forEach((d) => lv2Ids.push(d.id));
    }

    // Level 3: Batch query in groups of 30 parent IDs
    let lv3Count = 0;
    if (lv2Ids.length > 0) {
      const lv2Chunks = chunkArray(lv2Ids, 30);
      for (const chunk of lv2Chunks) {
        const q3 = query(collection(db, 'users'), where('invitedBy', 'in', chunk));
        const snap3 = await getDocs(q3);
        lv3Count += snap3.size;
      }
    }

    const counts: TeamCounts = {
      lv1: lv1Ids.length,
      lv2: lv2Ids.length,
      lv3: lv3Count
    };

    appCache.set(cacheKey, counts, 3 * 60 * 1000); // 3 min TTL
    return counts;
  } catch (err) {
    console.error('Error fetching team downline', err);
    return { lv1: 0, lv2: 0, lv3: 0 };
  }
}

// 4. PAGINATED USER ORDERS (WITH INDEX FALLBACK)
export interface PaginatedResult<T> {
  items: T[];
  lastVisible: DocumentSnapshot | null;
  hasMore: boolean;
}

export async function fetchUserOrdersPaginated(
  uid: string,
  pageSize = 10,
  lastVisibleDoc: DocumentSnapshot | null = null
): Promise<PaginatedResult<Order>> {
  try {
    const constraints: QueryConstraint[] = [
      where('uid', '==', uid),
      orderBy('date', 'desc'),
      limit(pageSize)
    ];
    if (lastVisibleDoc) {
      constraints.push(startAfter(lastVisibleDoc));
    }

    const q = query(collection(db, 'orders'), ...constraints);
    const snap = await getDocs(q);

    const items: Order[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastVisible: last,
      hasMore: snap.docs.length === pageSize
    };
  } catch (err: any) {
    // If index is missing or building, fallback gracefully without composite order
    console.warn('Falling back for user orders query:', err?.message);
    const qFallback = query(collection(db, 'orders'), where('uid', '==', uid), limit(pageSize * 2));
    const snap = await getDocs(qFallback);
    const items: Order[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
    items.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    return {
      items: items.slice(0, pageSize),
      lastVisible: null,
      hasMore: false
    };
  }
}

// 5. PAGINATED USER RECHARGES
export async function fetchUserRechargesPaginated(
  uid: string,
  pageSize = 10,
  lastVisibleDoc: DocumentSnapshot | null = null
): Promise<PaginatedResult<RechargeRecord>> {
  try {
    const constraints: QueryConstraint[] = [
      where('uid', '==', uid),
      orderBy('date', 'desc'),
      limit(pageSize)
    ];
    if (lastVisibleDoc) {
      constraints.push(startAfter(lastVisibleDoc));
    }
    const q = query(collection(db, 'recharges'), ...constraints);
    const snap = await getDocs(q);

    const items: RechargeRecord[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<RechargeRecord, 'id'>) }));
    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastVisible: last,
      hasMore: snap.docs.length === pageSize
    };
  } catch (err) {
    console.warn('Recharge query fallback', err);
    const q = query(collection(db, 'recharges'), where('uid', '==', uid), limit(pageSize * 2));
    const snap = await getDocs(q);
    const items: RechargeRecord[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<RechargeRecord, 'id'>) }));
    items.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    return {
      items: items.slice(0, pageSize),
      lastVisible: null,
      hasMore: false
    };
  }
}

// 6. PAGINATED USER WITHDRAWALS
export async function fetchUserWithdrawsPaginated(
  uid: string,
  pageSize = 10,
  lastVisibleDoc: DocumentSnapshot | null = null
): Promise<PaginatedResult<WithdrawRecord>> {
  try {
    const constraints: QueryConstraint[] = [
      where('uid', '==', uid),
      orderBy('date', 'desc'),
      limit(pageSize)
    ];
    if (lastVisibleDoc) {
      constraints.push(startAfter(lastVisibleDoc));
    }
    const q = query(collection(db, 'withdraws'), ...constraints);
    const snap = await getDocs(q);

    const items: WithdrawRecord[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<WithdrawRecord, 'id'>) }));
    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastVisible: last,
      hasMore: snap.docs.length === pageSize
    };
  } catch (err) {
    console.warn('Withdraw query fallback', err);
    const q = query(collection(db, 'withdraws'), where('uid', '==', uid), limit(pageSize * 2));
    const snap = await getDocs(q);
    const items: WithdrawRecord[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<WithdrawRecord, 'id'>) }));
    items.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    return {
      items: items.slice(0, pageSize),
      lastVisible: null,
      hasMore: false
    };
  }
}

// 7. REAL-TIME HOURLY EARNINGS ACCRUAL SYNC (ONLY ACTIVE ORDERS)
export async function syncActiveOrdersAccrual(
  uid: string,
  currentWithdrawBal: number
): Promise<{ updatedWithdrawBal: number; activeIncome: number; activeCount: number }> {
  try {
    // Only query active orders to minimize document reads!
    const q = query(
      collection(db, 'orders'),
      where('uid', '==', uid),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);

    const now = new Date();
    let totalActiveIncome = 0;
    let newlyMaturedPayout = 0;
    let activeCount = 0;

    for (const docSnap of snap.docs) {
      const order = docSnap.data() as Order;
      const docId = docSnap.id;

      let limitHours = Number(order.durationValue || order.duration || 1);
      const unit = order.durationUnit || 'days';
      if (unit === 'days') limitHours *= 24;
      else if (unit === 'months') limitHours *= 24 * 30;

      const start = order.date?.seconds ? new Date(order.date.seconds * 1000) : new Date();
      const diffMs = Math.max(0, now.getTime() - start.getTime());
      const hoursPassed = diffMs / (1000 * 60 * 60);

      const hourlyRate = Number(order.daily) / 24;
      const totalPotential = limitHours * hourlyRate;

      if (hoursPassed < limitHours) {
        const accrued = hoursPassed * hourlyRate;
        totalActiveIncome += accrued;
        activeCount++;

        // Update processedEarnings in order if changed significantly
        if (Math.abs(accrued - (order.processedEarnings || 0)) > 0.05) {
          await updateDoc(doc(db, 'orders', docId), { processedEarnings: accrued });
        }
      } else {
        // Order matured! Complete it and credit remaining return to withdrawBal
        newlyMaturedPayout += totalPotential;
        await updateDoc(doc(db, 'orders', docId), {
          status: 'completed',
          processedEarnings: totalPotential
        });
      }
    }

    const finalWithdrawBal = currentWithdrawBal + newlyMaturedPayout;

    // Update user document
    await updateDoc(doc(db, 'users', uid), {
      incomeBal: totalActiveIncome,
      withdrawBal: finalWithdrawBal,
      activeInvestments: activeCount
    });

    return {
      updatedWithdrawBal: finalWithdrawBal,
      activeIncome: totalActiveIncome,
      activeCount
    };
  } catch (err) {
    console.error('Error syncing order earnings', err);
    return {
      updatedWithdrawBal: currentWithdrawBal,
      activeIncome: 0,
      activeCount: 0
    };
  }
}

// 8. NOTIFICATIONS
export async function fetchUserNotifications(uid: string): Promise<NotificationItem[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      limit(25)
    );
    const snap = await getDocs(q);
    const notifs: NotificationItem[] = [];
    snap.forEach((d) => notifs.push({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
    notifs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    return notifs;
  } catch (err) {
    console.error('Error fetching notifications', err);
    return [];
  }
}

// 9. ADMIN ANALYTICS METRICS (OPTIMIZED WITH LIMITS & ESTIMATES)
export async function getAdminMetrics(): Promise<{
  totalUsers: number;
  totalRechargeApproved: number;
  totalWithdrawApproved: number;
  totalActiveInvestments: number;
}> {
  try {
    const [uSnap, rSnap, wSnap, oSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), limit(500))),
      getDocs(query(collection(db, 'recharges'), where('status', '==', 'approved'), limit(500))),
      getDocs(query(collection(db, 'withdraws'), where('status', '==', 'approved'), limit(500))),
      getDocs(query(collection(db, 'orders'), where('status', '==', 'active'), limit(500)))
    ]);

    let totalRec = 0;
    rSnap.forEach((d) => {
      totalRec += Number(d.data().amount || 0);
    });

    let totalWit = 0;
    wSnap.forEach((d) => {
      totalWit += Number(d.data().amount || 0);
    });

    return {
      totalUsers: uSnap.size,
      totalRechargeApproved: totalRec,
      totalWithdrawApproved: totalWit,
      totalActiveInvestments: oSnap.size
    };
  } catch (err) {
    console.error('Error fetching admin metrics', err);
    return {
      totalUsers: 0,
      totalRechargeApproved: 0,
      totalWithdrawApproved: 0,
      totalActiveInvestments: 0
    };
  }
}
