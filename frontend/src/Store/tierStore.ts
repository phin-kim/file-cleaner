import { create } from 'zustand';
import createClientLogger from '../utils/clientLogger';
const log = createClientLogger('TierStore.ts');
interface Tiers {
    tierId: string;
    setTierId: (tierId: string) => void;
}
export const useTierStore = create<Tiers>((set, get) => ({
    tierId: 'free',

    setTierId: (value) => {
        log.info(`Tier id from the store ${get().tierId}`);
        set({ tierId: value });
    },
}));
