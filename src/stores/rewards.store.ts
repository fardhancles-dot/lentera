import { rewardsService } from '../services/rewards.service';
import type {
  AchievementBoard,
  Inventory,
  PurchaseOutcome,
  QuestBoard,
  QuestClaim,
  ShopCatalog,
  UseItemOutcome,
} from '../types/rewards';
import { playerStore } from './player.store';
import { sessionStore } from './session.store';

export type RewardsLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RewardsStoreState {
  quests: QuestBoard | null;
  questsStatus: RewardsLoadStatus;
  questsError: string | null;
  achievements: AchievementBoard | null;
  achievementsStatus: RewardsLoadStatus;
  achievementsError: string | null;
  shop: ShopCatalog | null;
  shopStatus: RewardsLoadStatus;
  shopError: string | null;
  inventory: Inventory | null;
  inventoryStatus: RewardsLoadStatus;
  inventoryError: string | null;
}

type Listener = (state: RewardsStoreState) => void;

const initialState = (): RewardsStoreState => ({
  quests: null,
  questsStatus: 'idle',
  questsError: null,
  achievements: null,
  achievementsStatus: 'idle',
  achievementsError: null,
  shop: null,
  shopStatus: 'idle',
  shopError: null,
  inventory: null,
  inventoryStatus: 'idle',
  inventoryError: null,
});

class RewardsStore {
  private state: RewardsStoreState = initialState();
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private promises = new Map<string, Promise<void>>();

  getState(): RewardsStoreState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<RewardsStoreState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  private currentUserId(): string | null {
    return sessionStore.getState().user?.id ?? null;
  }

  private syncUser(): string | null {
    const userId = this.currentUserId();
    if (userId !== this.userId) {
      this.userId = userId;
      this.promises.clear();
      this.state = initialState();
    }
    return userId;
  }

  loadQuests(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return Promise.resolve();
    if (!force && this.state.questsStatus === 'ready' && this.state.quests) {
      return Promise.resolve();
    }
    const existing = this.promises.get('quests');
    if (existing) return existing;

    if (!this.state.quests) this.setState({ questsStatus: 'loading', questsError: null });

    const promise = rewardsService
      .loadQuests()
      .then((quests) => {
        if (this.userId !== userId) return;
        this.setState({ quests, questsStatus: 'ready', questsError: null });
      })
      .catch((error: unknown) => {
        if (this.userId !== userId) return;
        this.setState({
          questsStatus: 'error',
          questsError: error instanceof Error ? error.message : 'Misi gagal dimuat.',
        });
      })
      .finally(() => {
        this.promises.delete('quests');
      });

    this.promises.set('quests', promise);
    return promise;
  }

  loadAchievements(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return Promise.resolve();
    if (!force && this.state.achievementsStatus === 'ready' && this.state.achievements) {
      return Promise.resolve();
    }
    const existing = this.promises.get('achievements');
    if (existing) return existing;

    if (!this.state.achievements) {
      this.setState({ achievementsStatus: 'loading', achievementsError: null });
    }

    const promise = rewardsService
      .loadAchievements()
      .then((achievements) => {
        if (this.userId !== userId) return;
        this.setState({ achievements, achievementsStatus: 'ready', achievementsError: null });
      })
      .catch((error: unknown) => {
        if (this.userId !== userId) return;
        this.setState({
          achievementsStatus: 'error',
          achievementsError:
            error instanceof Error ? error.message : 'Pencapaian gagal dimuat.',
        });
      })
      .finally(() => {
        this.promises.delete('achievements');
      });

    this.promises.set('achievements', promise);
    return promise;
  }

  loadShop(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return Promise.resolve();
    if (!force && this.state.shopStatus === 'ready' && this.state.shop) {
      return Promise.resolve();
    }
    const existing = this.promises.get('shop');
    if (existing) return existing;

    if (!this.state.shop) this.setState({ shopStatus: 'loading', shopError: null });

    const promise = rewardsService
      .loadShop()
      .then((shop) => {
        if (this.userId !== userId) return;
        this.setState({ shop, shopStatus: 'ready', shopError: null });
      })
      .catch((error: unknown) => {
        if (this.userId !== userId) return;
        this.setState({
          shopStatus: 'error',
          shopError: error instanceof Error ? error.message : 'Toko gagal dimuat.',
        });
      })
      .finally(() => {
        this.promises.delete('shop');
      });

    this.promises.set('shop', promise);
    return promise;
  }

  loadInventory(force = false): Promise<void> {
    const userId = this.syncUser();
    if (!userId) return Promise.resolve();
    if (!force && this.state.inventoryStatus === 'ready' && this.state.inventory) {
      return Promise.resolve();
    }
    const existing = this.promises.get('inventory');
    if (existing) return existing;

    if (!this.state.inventory) {
      this.setState({ inventoryStatus: 'loading', inventoryError: null });
    }

    const promise = rewardsService
      .loadInventory()
      .then((inventory) => {
        if (this.userId !== userId) return;
        this.setState({ inventory, inventoryStatus: 'ready', inventoryError: null });
      })
      .catch((error: unknown) => {
        if (this.userId !== userId) return;
        this.setState({
          inventoryStatus: 'error',
          inventoryError: error instanceof Error ? error.message : 'Tas gagal dimuat.',
        });
      })
      .finally(() => {
        this.promises.delete('inventory');
      });

    this.promises.set('inventory', promise);
    return promise;
  }

  async claimQuest(questId: string): Promise<QuestClaim> {
    const result = await rewardsService.claimQuest(questId);
    await Promise.all([this.loadQuests(true), playerStore.load(true)]);
    return result;
  }

  async purchase(itemId: string): Promise<PurchaseOutcome> {
    const result = await rewardsService.purchase(itemId);
    await Promise.all([
      this.loadShop(true),
      this.loadInventory(true),
      playerStore.load(true),
    ]);
    return result;
  }

  async useItem(itemId: string): Promise<UseItemOutcome> {
    const result = await rewardsService.useItem(itemId);
    await Promise.all([this.loadInventory(true), playerStore.load(true)]);
    return result;
  }

  clear(): void {
    this.userId = null;
    this.promises.clear();
    this.state = initialState();
    for (const listener of this.listeners) listener(this.state);
  }
}

export const rewardsStore = new RewardsStore();
