import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  DocumentSnapshot
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { appCache } from './services/cache';
import {
  getGlobalSettings,
  updateGlobalSettings,
  getProducts,
  getTeamCounts,
  fetchUserOrdersPaginated,
  fetchUserRechargesPaginated,
  fetchUserWithdrawsPaginated,
  syncActiveOrdersAccrual,
  fetchUserNotifications,
  getAdminMetrics,
  DEFAULT_SETTINGS
} from './services/db';
import {
  UserData,
  GlobalSettings,
  Product,
  Order,
  RechargeRecord,
  WithdrawRecord,
  NotificationItem,
  AnnouncementItem,
  TeamCounts,
  BlogProof
} from './types';

// Modular Components
import { AlertToast } from './components/AlertToast';
import { GlobalNoticeModal, NotificationsModal } from './components/Modals';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { AuthView } from './components/AuthView';
import { HomeTab } from './components/HomeTab';
import { InvestTab } from './components/InvestTab';
import { NoticeTab } from './components/NoticeTab';
import { BlogTab } from './components/BlogTab';
import { AccountTab } from './components/AccountTab';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  // App state
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tabHome' | 'tabInvest' | 'tabNotice' | 'tabBlog' | 'tabAccount'>('tabHome');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Global settings
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);

  // Products (cached)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Team counts (cached)
  const [teamCounts, setTeamCounts] = useState<TeamCounts>({ lv1: 0, lv2: 0, lv3: 0 });

  // Paginated user orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLastDoc, setOrdersLastDoc] = useState<DocumentSnapshot | null>(null);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Paginated user recharges
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [rechargesLastDoc, setRechargesLastDoc] = useState<DocumentSnapshot | null>(null);
  const [rechargesHasMore, setRechargesHasMore] = useState(false);
  const [rechargesLoading, setRechargesLoading] = useState(false);

  // Paginated user withdrawals
  const [withdraws, setWithdraws] = useState<WithdrawRecord[]>([]);
  const [withdrawsLastDoc, setWithdrawsLastDoc] = useState<DocumentSnapshot | null>(null);
  const [withdrawsHasMore, setWithdrawsHasMore] = useState(false);
  const [withdrawsLoading, setWithdrawsLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Global Notice
  const [globalNotice, setGlobalNotice] = useState<string>('');
  const [showGlobalNotice, setShowGlobalNotice] = useState(false);

  // Lucky Draw Wheel
  const [showWheelModal, setShowWheelModal] = useState(false);

  // Community Blog posts
  const [blogPosts, setBlogPosts] = useState<BlogProof[]>([
    {
      id: 'p-1',
      phone: '98****42',
      tag: 'VIP 2',
      title: 'Received fast ₹2,400 withdrawal credited to SBI within 15 minutes! Thank you SR MILKS.',
      amount: 2400,
      img1: 'https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?auto=format&fit=crop&w=300&q=80',
      img2: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
      date: '2026-09-26 10:15'
    }
  ]);

  // Admin Data states
  const [adminUsers, setAdminUsers] = useState<UserData[]>([]);
  const [adminPendingRecharges, setAdminPendingRecharges] = useState<RechargeRecord[]>([]);
  const [adminPendingWithdraws, setAdminPendingWithdraws] = useState<WithdrawRecord[]>([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState<AnnouncementItem[]>([]);
  const [adminMetrics, setAdminMetrics] = useState({
    totalUsers: 0,
    totalRechargeApproved: 0,
    totalWithdrawApproved: 0,
    totalActiveInvestments: 0
  });

  // Account tab direct deep navigation
  const [accountSubPageTarget, setAccountSubPageTarget] = useState<string | null>(null);

  // Alert toast
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    type: 'error' | 'success' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false
  });

  const showAlert = useCallback(
    (message: string, type: 'error' | 'success' | 'info' = 'error') => {
      setAlertInfo({ message, type, visible: true });
      setTimeout(() => {
        setAlertInfo((prev) => (prev.message === message ? { ...prev, visible: false } : prev));
      }, 4000);
    },
    []
  );

  // 1. Initial Load of Global Settings (with cache)
  useEffect(() => {
    getGlobalSettings().then((s) => {
      setSettings(s);
      if (s.noticeMsg) {
        const dismissed = sessionStorage.getItem('dismissed_notice');
        if (dismissed !== s.noticeMsg) {
          setGlobalNotice(s.noticeMsg);
          setShowGlobalNotice(true);
        }
      }
    });

    // Load initial products (cached)
    setProductsLoading(true);
    getProducts()
      .then((p) => setProducts(p))
      .finally(() => setProductsLoading(false));
  }, []);

  // 2. Authentication State Observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          let data: UserData;
          if (snap.exists()) {
            data = { uid: firebaseUser.uid, ...(snap.data() as any) };
          } else {
            // Auto initialize new profile
            const generatedInvite = Math.random().toString(36).substring(2, 8).toUpperCase();
            data = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Investor',
              inviteCode: generatedInvite,
              rechargeBal: 0,
              withdrawBal: 0,
              incomeBal: 0,
              totalRecharged: 0,
              totalCommission: 0,
              spinCount: 1,
              activeInvestments: 0,
              role: firebaseUser.email?.includes('admin') ? 'admin' : 'user'
            };
            await setDoc(userDocRef, data);
          }

          setCurrentUser(data);

          // Fast cached queries for user specifics
          loadTeamStats(firebaseUser.uid);
          loadUserOrders(firebaseUser.uid, true);
          loadUserRecharges(firebaseUser.uid, true);
          loadUserWithdraws(firebaseUser.uid, true);
          loadNotifications(firebaseUser.uid);

          // Background sync of real-time accrued returns (only touches active orders!)
          syncActiveOrdersAccrual(firebaseUser.uid, data.withdrawBal).then((syncRes) => {
            if (syncRes.updatedWithdrawBal !== data.withdrawBal || syncRes.activeIncome !== data.incomeBal) {
              setCurrentUser((prev) =>
                prev
                  ? {
                      ...prev,
                      withdrawBal: syncRes.updatedWithdrawBal,
                      incomeBal: syncRes.activeIncome,
                      activeInvestments: syncRes.activeCount
                    }
                  : null
              );
            }
          });
        } catch (err) {
          console.error('Error fetching user data', err);
        }
      } else {
        setCurrentUser(null);
        setIsAdminMode(false);
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  // Load team downlines (with chunked batching & 3-min cache)
  const loadTeamStats = async (uid: string, force = false) => {
    const counts = await getTeamCounts(uid, force);
    setTeamCounts(counts);
  };

  // Paginated user orders
  const loadUserOrders = async (uid: string, reset = false) => {
    if (ordersLoading) return;
    setOrdersLoading(true);
    try {
      const cursor = reset ? null : ordersLastDoc;
      const res = await fetchUserOrdersPaginated(uid, 10, cursor);
      if (reset) {
        setOrders(res.items);
      } else {
        setOrders((prev) => [...prev, ...res.items]);
      }
      setOrdersLastDoc(res.lastVisible);
      setOrdersHasMore(res.hasMore);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Paginated user recharges
  const loadUserRecharges = async (uid: string, reset = false) => {
    if (rechargesLoading) return;
    setRechargesLoading(true);
    try {
      const cursor = reset ? null : rechargesLastDoc;
      const res = await fetchUserRechargesPaginated(uid, 10, cursor);
      if (reset) {
        setRecharges(res.items);
      } else {
        setRecharges((prev) => [...prev, ...res.items]);
      }
      setRechargesLastDoc(res.lastVisible);
      setRechargesHasMore(res.hasMore);
    } finally {
      setRechargesLoading(false);
    }
  };

  // Paginated user withdrawals
  const loadUserWithdraws = async (uid: string, reset = false) => {
    if (withdrawsLoading) return;
    setWithdrawsLoading(true);
    try {
      const cursor = reset ? null : withdrawsLastDoc;
      const res = await fetchUserWithdrawsPaginated(uid, 10, cursor);
      if (reset) {
        setWithdraws(res.items);
      } else {
        setWithdraws((prev) => [...prev, ...res.items]);
      }
      setWithdrawsLastDoc(res.lastVisible);
      setWithdrawsHasMore(res.hasMore);
    } finally {
      setWithdrawsLoading(false);
    }
  };

  // User notifications
  const loadNotifications = async (uid: string) => {
    setNotifsLoading(true);
    try {
      const notifs = await fetchUserNotifications(uid);
      setNotifications(notifs);
    } finally {
      setNotifsLoading(false);
    }
  };

  // Admin Data Loader
  const loadAdminData = async () => {
    try {
      const m = await getAdminMetrics();
      setAdminMetrics(m);

      const [uSnap, rSnap, wSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'))),
        getDocs(query(collection(db, 'recharges'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'withdraws'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'announcements')))
      ]);

      const uList: UserData[] = [];
      uSnap.forEach((d) => uList.push({ uid: d.id, ...(d.data() as any) }));
      setAdminUsers(uList);

      const rList: RechargeRecord[] = [];
      rSnap.forEach((d) => rList.push({ id: d.id, ...(d.data() as any) }));
      setAdminPendingRecharges(rList);

      const wList: WithdrawRecord[] = [];
      wSnap.forEach((d) => wList.push({ id: d.id, ...(d.data() as any) }));
      setAdminPendingWithdraws(wList);

      const aList: AnnouncementItem[] = [];
      aSnap.forEach((d) => aList.push({ id: d.id, ...(d.data() as any) }));
      setAdminAnnouncements(aList);
    } catch (err) {
      console.error('Error fetching admin queues', err);
    }
  };

  // Auth Actions
  const handleLogin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    showAlert('Logged in successfully!', 'success');
  };

  const handleRegister = async (email: string, pass: string, name: string, inviteCode: string) => {
    let parentUid: string | undefined = undefined;
    if (inviteCode) {
      const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        parentUid = snap.docs[0].id;
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newUid = cred.user.uid;
    const generatedInvite = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newUserDoc: UserData = {
      uid: newUid,
      email,
      name,
      inviteCode: generatedInvite,
      invitedBy: parentUid,
      rechargeBal: 0,
      withdrawBal: 0,
      incomeBal: 0,
      totalRecharged: 0,
      totalCommission: 0,
      spinCount: 1,
      activeInvestments: 0,
      role: email.includes('admin') ? 'admin' : 'user'
    };

    await setDoc(doc(db, 'users', newUid), newUserDoc);
    setCurrentUser(newUserDoc);
    showAlert('Registration successful! Welcome bonus 1 Lucky Spin credited.', 'success');
  };

  const handleForgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const handleLogout = async () => {
    await signOut(auth);
    appCache.clearAll();
    showAlert('Logged out successfully', 'info');
  };

  // Daily Sign-In
  const handleDailySignIn = async () => {
    if (!currentUser) return;
    const reward = Math.floor(Math.random() * 5) + 1;
    const today = new Date().toDateString();
    const newWithdraw = currentUser.withdrawBal + reward;

    await updateDoc(doc(db, 'users', currentUser.uid), {
      withdrawBal: newWithdraw,
      lastSignIn: today
    });

    setCurrentUser((prev) => (prev ? { ...prev, withdrawBal: newWithdraw, lastSignIn: today } : null));
    showAlert(`Checked in! ₹${reward} added to your Withdrawable Balance.`, 'success');
  };

  // VIP Claim
  const handleClaimVipReward = async (level: number, bonusAmt: number) => {
    if (!currentUser) return;
    const today = new Date().toDateString();
    const newBal = currentUser.withdrawBal + bonusAmt;

    await updateDoc(doc(db, 'users', currentUser.uid), {
      withdrawBal: newBal,
      lastVipClaimDate: today
    });

    setCurrentUser((prev) => (prev ? { ...prev, withdrawBal: newBal, lastVipClaimDate: today } : null));
    showAlert(`Claimed VIP ${level} Daily Bonus of ₹${bonusAmt}!`, 'success');
  };

  // Lucky Wheel Spin
  const handleSpinWin = async (amount: number) => {
    if (!currentUser) return;
    const newSpins = Math.max(0, currentUser.spinCount - 1);
    const newBal = currentUser.withdrawBal + amount;

    await updateDoc(doc(db, 'users', currentUser.uid), {
      spinCount: newSpins,
      withdrawBal: newBal
    });

    setCurrentUser((prev) => (prev ? { ...prev, spinCount: newSpins, withdrawBal: newBal } : null));
    showAlert(`Congratulations! You won ₹${amount} credited to Withdrawable Balance.`, 'success');
  };

  // Buy Product (Investment Plan)
  const handleBuyProduct = async (product: Product) => {
    if (!currentUser) return;
    const priceNum = Number(product.price);
    const newRecharge = currentUser.rechargeBal - priceNum;
    const newSpins = currentUser.spinCount + 1;
    const newActive = currentUser.activeInvestments + 1;

    // 1. Update user wallet
    await updateDoc(doc(db, 'users', currentUser.uid), {
      rechargeBal: newRecharge,
      spinCount: newSpins,
      activeInvestments: newActive
    });

    // 2. Insert new order
    const durVal = product.durationValue || product.duration;
    const durUnit = product.durationUnit || 'days';
    const newOrderData: Omit<Order, 'id'> = {
      uid: currentUser.uid,
      productId: product.id,
      title: product.title,
      price: priceNum,
      daily: Number(product.daily),
      duration: Number(product.duration),
      durationValue: Number(durVal),
      durationUnit: durUnit,
      processedEarnings: 0,
      status: 'active',
      date: new Date()
    };

    const oRef = await addDoc(collection(db, 'orders'), newOrderData);

    // 3. Multi-Tier Downline Commission Distribution
    if (currentUser.invitedBy) {
      try {
        const ref1Snap = await getDoc(doc(db, 'users', currentUser.invitedBy));
        if (ref1Snap.exists()) {
          const r1 = ref1Snap.data() as UserData;
          const comm1 = priceNum * (settings.tier1 / 100);
          await updateDoc(doc(db, 'users', ref1Snap.id), {
            withdrawBal: (r1.withdrawBal || 0) + comm1,
            totalCommission: (r1.totalCommission || 0) + comm1
          });

          if (r1.invitedBy) {
            const ref2Snap = await getDoc(doc(db, 'users', r1.invitedBy));
            if (ref2Snap.exists()) {
              const r2 = ref2Snap.data() as UserData;
              const comm2 = priceNum * (settings.tier2 / 100);
              await updateDoc(doc(db, 'users', ref2Snap.id), {
                withdrawBal: (r2.withdrawBal || 0) + comm2,
                totalCommission: (r2.totalCommission || 0) + comm2
              });

              if (r2.invitedBy) {
                const ref3Snap = await getDoc(doc(db, 'users', r2.invitedBy));
                if (ref3Snap.exists()) {
                  const r3 = ref3Snap.data() as UserData;
                  const comm3 = priceNum * (settings.tier3 / 100);
                  await updateDoc(doc(db, 'users', ref3Snap.id), {
                    withdrawBal: (r3.withdrawBal || 0) + comm3,
                    totalCommission: (r3.totalCommission || 0) + comm3
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Commission distribution error', err);
      }
    }

    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            rechargeBal: newRecharge,
            spinCount: newSpins,
            activeInvestments: newActive
          }
        : null
    );

    // Prepend to orders list for instant 0ms feedback
    setOrders((prev) => [{ id: oRef.id, ...newOrderData }, ...prev]);
    appCache.invalidatePattern(`userOrders:${currentUser.uid}`);
    showAlert('Investment plan activated! 1 free Wheel Spin earned.', 'success');
  };

  // Save Bank Details
  const handleSaveBankDetails = async (name: string, accNo: string, ifsc: string) => {
    if (!currentUser) return;
    const bankDetails = { name, accNo, ifsc };
    await updateDoc(doc(db, 'users', currentUser.uid), { bankDetails });
    setCurrentUser((prev) => (prev ? { ...prev, bankDetails } : null));
  };

  // Submit Withdrawal
  const handleWithdrawRequest = async (amount: number) => {
    if (!currentUser || !currentUser.bankDetails) return;
    const tax = amount * (settings.withdrawTax / 100);
    const receiveAmount = amount - tax;
    const newBal = currentUser.withdrawBal - amount;

    await updateDoc(doc(db, 'users', currentUser.uid), { withdrawBal: newBal });
    const withdrawRecord: Omit<WithdrawRecord, 'id'> = {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.bankDetails.name,
      accNo: currentUser.bankDetails.accNo,
      ifsc: currentUser.bankDetails.ifsc,
      amount,
      tax,
      receiveAmount,
      status: 'pending',
      remark: 'Under system verification...',
      date: new Date()
    };

    const wRef = await addDoc(collection(db, 'withdraws'), withdrawRecord);
    setCurrentUser((prev) => (prev ? { ...prev, withdrawBal: newBal } : null));
    setWithdraws((prev) => [{ id: wRef.id, ...withdrawRecord }, ...prev]);
    appCache.invalidatePattern(`userWithdraws:${currentUser.uid}`);
  };

  // Submit Recharge UTR
  const handleRechargeUTR = async (amount: number, utr: string) => {
    if (!currentUser) return;
    const recData: Omit<RechargeRecord, 'id'> = {
      uid: currentUser.uid,
      email: currentUser.email,
      amount,
      utr,
      status: 'pending',
      date: new Date()
    };
    const rRef = await addDoc(collection(db, 'recharges'), recData);
    setRecharges((prev) => [{ id: rRef.id, ...recData }, ...prev]);
    appCache.invalidatePattern(`userRecharges:${currentUser.uid}`);
  };

  // Nickname update
  const handleUpdateNickname = async (name: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), { name });
    setCurrentUser((prev) => (prev ? { ...prev, name } : null));
  };

  // Blog post addition
  const handleAddBlogPost = async (post: Omit<BlogProof, 'id' | 'date'>) => {
    const newPost: BlogProof = {
      id: 'p-' + Date.now(),
      ...post,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setBlogPosts((prev) => [newPost, ...prev]);
  };

  // ----------------------------------------------------
  // ADMIN PANEL HANDLERS
  // ----------------------------------------------------
  const handleAdminUpdateSettings = async (updates: Partial<GlobalSettings>) => {
    await updateGlobalSettings(updates);
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleAdminAddProduct = async (prod: Omit<Product, 'id'>) => {
    const docRef = await addDoc(collection(db, 'products'), prod);
    const created: Product = { id: docRef.id, ...prod };
    setProducts((prev) => [created, ...prev]);
    appCache.invalidatePattern('products');
  };

  const handleAdminDeleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
    appCache.invalidatePattern('products');
  };

  const handleAdminUpdateUserBalance = async (
    uid: string,
    updates: { rechargeBal?: number; withdrawBal?: number }
  ) => {
    await updateDoc(doc(db, 'users', uid), updates);
    setAdminUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
    );
    if (currentUser && currentUser.uid === uid) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleAdminApproveRecharge = async (rec: RechargeRecord) => {
    await updateDoc(doc(db, 'recharges', rec.id), { status: 'approved' });
    const userDocRef = doc(db, 'users', rec.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const uData = snap.data() as UserData;
      const newRecBal = (uData.rechargeBal || 0) + rec.amount;
      const newTotalRec = (uData.totalRecharged || 0) + rec.amount;
      await updateDoc(userDocRef, {
        rechargeBal: newRecBal,
        totalRecharged: newTotalRec
      });
      // Send notification
      await addDoc(collection(db, 'notifications'), {
        uid: rec.uid,
        title: 'Recharge Approved!',
        msg: `Your deposit of ₹${rec.amount.toFixed(2)} has been verified and added to your recharge wallet.`,
        type: 'success',
        date: new Date(),
        read: false
      });
    }
    setAdminPendingRecharges((prev) => prev.filter((r) => r.id !== rec.id));
    showAlert('Recharge approved and user balance updated!', 'success');
  };

  const handleAdminRejectRecharge = async (rec: RechargeRecord, reason: string) => {
    await updateDoc(doc(db, 'recharges', rec.id), { status: 'rejected' });
    await addDoc(collection(db, 'notifications'), {
      uid: rec.uid,
      title: 'Recharge Rejected',
      msg: `Your deposit of ₹${rec.amount} was rejected. Reason: ${reason}`,
      type: 'error',
      date: new Date(),
      read: false
    });
    setAdminPendingRecharges((prev) => prev.filter((r) => r.id !== rec.id));
  };

  const handleAdminApproveWithdraw = async (w: WithdrawRecord, remark?: string) => {
    const finalRemark = remark || 'Payment credited to your bank account via UPI.';
    await updateDoc(doc(db, 'withdraws', w.id), {
      status: 'approved',
      remark: finalRemark
    });
    await addDoc(collection(db, 'notifications'), {
      uid: w.uid,
      title: 'Withdrawal Completed',
      msg: `Your withdrawal of ₹${w.amount} (Net ₹${w.receiveAmount}) is PAID. ${finalRemark}`,
      type: 'success',
      date: new Date(),
      read: false
    });
    setAdminPendingWithdraws((prev) => prev.filter((item) => item.id !== w.id));
  };

  const handleAdminRejectWithdraw = async (w: WithdrawRecord, reason: string) => {
    await updateDoc(doc(db, 'withdraws', w.id), {
      status: 'rejected',
      remark: reason
    });
    // Refund the withdraw balance
    const userDocRef = doc(db, 'users', w.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const uData = snap.data() as UserData;
      await updateDoc(userDocRef, {
        withdrawBal: (uData.withdrawBal || 0) + w.amount
      });
    }
    await addDoc(collection(db, 'notifications'), {
      uid: w.uid,
      title: 'Withdrawal Refunded',
      msg: `Your withdrawal of ₹${w.amount} was rejected and refunded to your balance. Reason: ${reason}`,
      type: 'error',
      date: new Date(),
      read: false
    });
    setAdminPendingWithdraws((prev) => prev.filter((item) => item.id !== w.id));
  };

  const handleAdminAddAnnouncement = async (text: string) => {
    const docRef = await addDoc(collection(db, 'announcements'), {
      text,
      date: new Date()
    });
    setAdminAnnouncements((prev) => [{ id: docRef.id, text, date: new Date() }, ...prev]);
  };

  const handleAdminDeleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
    setAdminAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#00b4d8] border-t-transparent animate-spin mb-4"></div>
        <h2 className="text-xl font-bold tracking-wide">
          SR <span className="text-gradient">MILKS</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
          Loading High-Speed Cache...
        </p>
      </div>
    );
  }

  // Auth Screen
  if (!currentUser) {
    return (
      <>
        <AlertToast
          message={alertInfo.message}
          type={alertInfo.type}
          visible={alertInfo.visible}
          onClose={() => setAlertInfo((prev) => ({ ...prev, visible: false }))}
        />
        <AuthView
          onLogin={handleLogin}
          onRegister={handleRegister}
          onForgotPassword={handleForgotPassword}
          loading={false}
          showAlert={showAlert}
        />
      </>
    );
  }

  // Admin Mode View
  if (isAdminMode) {
    return (
      <>
        <AlertToast
          message={alertInfo.message}
          type={alertInfo.type}
          visible={alertInfo.visible}
          onClose={() => setAlertInfo((prev) => ({ ...prev, visible: false }))}
        />
        <AdminPanel
          settings={settings}
          onUpdateSettings={handleAdminUpdateSettings}
          products={products}
          onAddProduct={handleAdminAddProduct}
          onDeleteProduct={handleAdminDeleteProduct}
          users={adminUsers}
          onUpdateUserBalance={handleAdminUpdateUserBalance}
          pendingRecharges={adminPendingRecharges}
          onApproveRecharge={handleAdminApproveRecharge}
          onRejectRecharge={handleAdminRejectRecharge}
          pendingWithdraws={adminPendingWithdraws}
          onApproveWithdraw={handleAdminApproveWithdraw}
          onRejectWithdraw={handleAdminRejectWithdraw}
          announcements={adminAnnouncements}
          onAddAnnouncement={handleAdminAddAnnouncement}
          onDeleteAnnouncement={handleAdminDeleteAnnouncement}
          metrics={adminMetrics}
          onExitAdmin={() => setIsAdminMode(false)}
          showAlert={showAlert}
        />
      </>
    );
  }

  // Unread notifications count
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      {/* Toast Alert */}
      <AlertToast
        message={alertInfo.message}
        type={alertInfo.type}
        visible={alertInfo.visible}
        onClose={() => setAlertInfo((prev) => ({ ...prev, visible: false }))}
      />

      {/* Global Notice Modal */}
      <GlobalNoticeModal
        isOpen={showGlobalNotice}
        message={globalNotice}
        onClose={() => {
          setShowGlobalNotice(false);
          sessionStorage.setItem('dismissed_notice', globalNotice);
        }}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        loading={notifsLoading}
      />

      {/* Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={showWheelModal}
        onClose={() => setShowWheelModal(false)}
        spinCount={currentUser.spinCount || 0}
        onSpinWin={handleSpinWin}
      />

      {/* Admin Quick Switch for Admin Users */}
      {currentUser.role === 'admin' && (
        <div className="fixed top-2 right-2 z-[100]">
          <button
            onClick={() => {
              loadAdminData();
              setIsAdminMode(true);
            }}
            className="bg-[#00b4d8] text-black font-extrabold text-[10px] px-3 py-1.5 rounded-full shadow-lg border border-white hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <i className="fas fa-user-shield mr-1"></i> ADMIN PRO
          </button>
        </div>
      )}

      {/* MAIN APPLICATION TABS */}
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-[#0d1b2a]">
        {activeTab === 'tabHome' && (
          <HomeTab
            user={currentUser}
            settings={settings}
            teamCounts={teamCounts}
            unreadCount={unreadNotifs}
            onOpenNotifications={() => {
              loadNotifications(currentUser.uid);
              setShowNotificationsModal(true);
            }}
            onOpenRecharge={() => {
              setAccountSubPageTarget('accountRechargeView');
              setActiveTab('tabAccount');
            }}
            onOpenWithdraw={() => {
              setAccountSubPageTarget('accountWithdrawView');
              setActiveTab('tabAccount');
            }}
            onOpenTeam={() => {
              setAccountSubPageTarget('accountTeamView');
              setActiveTab('tabAccount');
            }}
            onOpenWheel={() => setShowWheelModal(true)}
            onNavigateToInvest={() => setActiveTab('tabInvest')}
            onDailySignIn={handleDailySignIn}
            showAlert={showAlert}
          />
        )}

        {activeTab === 'tabInvest' && (
          <InvestTab
            products={products}
            rechargeBal={currentUser.rechargeBal}
            onBuyProduct={handleBuyProduct}
            onOpenOrderHistory={() => {
              setAccountSubPageTarget('accountOrderRecordView');
              setActiveTab('tabAccount');
            }}
            loading={productsLoading}
            showAlert={showAlert}
          />
        )}

        {activeTab === 'tabNotice' && (
          <NoticeTab
            user={currentUser}
            onClaimVipReward={handleClaimVipReward}
            onBackToHome={() => setActiveTab('tabHome')}
            showAlert={showAlert}
          />
        )}

        {activeTab === 'tabBlog' && (
          <BlogTab posts={blogPosts} onAddPost={handleAddBlogPost} showAlert={showAlert} />
        )}

        {activeTab === 'tabAccount' && (
          <AccountTab
            user={currentUser}
            settings={settings}
            teamCounts={teamCounts}
            orders={orders}
            ordersHasMore={ordersHasMore}
            ordersLoading={ordersLoading}
            onLoadMoreOrders={() => loadUserOrders(currentUser.uid)}
            recharges={recharges}
            rechargesHasMore={rechargesHasMore}
            rechargesLoading={rechargesLoading}
            onLoadMoreRecharges={() => loadUserRecharges(currentUser.uid)}
            withdraws={withdraws}
            withdrawsHasMore={withdrawsHasMore}
            withdrawsLoading={withdrawsLoading}
            onLoadMoreWithdraws={() => loadUserWithdraws(currentUser.uid)}
            onSaveBankDetails={handleSaveBankDetails}
            onSubmitWithdraw={handleWithdrawRequest}
            onSubmitRechargeUTR={handleRechargeUTR}
            onUpdateNickname={handleUpdateNickname}
            onLogout={handleLogout}
            showAlert={showAlert}
            initialSubPage={accountSubPageTarget}
            onClearInitialSubPage={() => setAccountSubPageTarget(null)}
          />
        )}

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1e2a3e] border-t border-gray-800 flex justify-around py-3 z-[100] pb-5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => {
              setAccountSubPageTarget(null);
              setActiveTab('tabHome');
            }}
            className={`nav-btn flex flex-col items-center w-1/5 cursor-pointer transition ${
              activeTab === 'tabHome' ? 'text-[#00b4d8]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fas fa-house text-xl mb-1"></i>
            <span className="text-[10px] font-medium">Home</span>
          </button>

          <button
            onClick={() => {
              setAccountSubPageTarget(null);
              setActiveTab('tabInvest');
            }}
            className={`nav-btn flex flex-col items-center w-1/5 cursor-pointer transition ${
              activeTab === 'tabInvest' ? 'text-[#00b4d8]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fas fa-chart-simple text-xl mb-1"></i>
            <span className="text-[10px] font-medium">Invest</span>
          </button>

          <button
            onClick={() => {
              setAccountSubPageTarget(null);
              setActiveTab('tabNotice');
            }}
            className={`nav-btn flex flex-col items-center w-1/5 cursor-pointer transition ${
              activeTab === 'tabNotice' ? 'text-[#00b4d8]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fas fa-gift text-xl mb-1 drop-shadow-[0_0_5px_rgba(0,180,216,0.5)]"></i>
            <span className="text-[10px] font-medium">Notice</span>
          </button>

          <button
            onClick={() => {
              setAccountSubPageTarget(null);
              setActiveTab('tabBlog');
            }}
            className={`nav-btn flex flex-col items-center w-1/5 cursor-pointer transition ${
              activeTab === 'tabBlog' ? 'text-[#00b4d8]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fas fa-comment-dots text-xl mb-1"></i>
            <span className="text-[10px] font-medium">Blog</span>
          </button>

          <button
            onClick={() => {
              setAccountSubPageTarget(null);
              setActiveTab('tabAccount');
            }}
            className={`nav-btn flex flex-col items-center w-1/5 cursor-pointer transition ${
              activeTab === 'tabAccount' ? 'text-[#00b4d8]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fas fa-user text-xl mb-1"></i>
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
