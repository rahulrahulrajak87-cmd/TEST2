export interface BankDetails {
  name: string;
  accNo: string;
  ifsc: string;
}

export interface UserData {
  uid: string;
  email: string;
  name: string;
  inviteCode: string;
  invitedBy?: string;
  rechargeBal: number;
  withdrawBal: number;
  incomeBal: number;
  totalRecharged: number;
  totalCommission: number;
  spinCount: number;
  activeInvestments: number;
  lastSignIn?: string;
  lastVipClaimDate?: string;
  bankDetails?: BankDetails;
  role?: 'admin' | 'user';
  createdAt?: any;
}

export interface Product {
  id: string;
  title: string;
  category: 'stable' | 'welfare' | 'activity';
  price: number | string;
  daily: number | string;
  duration: number;
  durationValue?: number;
  durationUnit?: 'hours' | 'days' | 'months';
  image: string;
}

export interface Order {
  id: string;
  uid: string;
  productId: string;
  title: string;
  price: number;
  daily: number;
  duration: number;
  durationValue: number;
  durationUnit: 'hours' | 'days' | 'months';
  processedEarnings: number;
  status: 'active' | 'completed';
  date: any;
}

export interface RechargeRecord {
  id: string;
  uid: string;
  email: string;
  amount: number;
  utr: string;
  status: 'pending' | 'approved' | 'rejected';
  date: any;
}

export interface WithdrawRecord {
  id: string;
  uid: string;
  email: string;
  name: string;
  accNo: string;
  ifsc: string;
  amount: number;
  tax: number;
  receiveAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  date: any;
}

export interface NotificationItem {
  id: string;
  uid: string;
  title: string;
  msg: string;
  type: 'info' | 'success' | 'error';
  date: any;
  read: boolean;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  date: any;
}

export interface GlobalSettings {
  upiId: string;
  upiIds: string[];
  noticeMsg: string;
  withdrawSwitch: boolean;
  minRecharge: number;
  minWithdraw: number;
  withdrawTax: number;
  tier1: number;
  tier2: number;
  tier3: number;
}

export interface TeamCounts {
  lv1: number;
  lv2: number;
  lv3: number;
}

export interface BlogProof {
  id: string;
  phone: string;
  tag: string;
  title: string;
  img1: string;
  img2: string;
  amount: number;
  date: string;
}
