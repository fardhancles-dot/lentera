export interface PlayerHearts {
  current: number;
  max: number;
  nextRefillSeconds: number;
  regenMinutes: number;
  refillCostCoins: number;
}

export interface PlayerStreak {
  current: number;
  longest: number;
  lastActivityDate: string | null;
  todayDate: string;
  activityDays: string[];
}

export interface PlayerLevel {
  level: number;
  title: string;
  xpRequired: number;
  nextLevelXp: number | null;
  xpToNext: number;
  progressPercent: number;
}

export interface PlayerState {
  totalXp: number;
  todayXp: number;
  coins: number;
  hearts: PlayerHearts;
  streak: PlayerStreak;
  level: PlayerLevel;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  source: string;
  createdAt: string;
}

export interface PlayerWallet extends PlayerState {
  transactions: WalletTransaction[];
  xpTransactions: WalletTransaction[];
}

export interface RefillOutcome {
  state: PlayerState;
  alreadyFull: boolean;
  coinsSpent: number;
  heartsRestored: number;
}
