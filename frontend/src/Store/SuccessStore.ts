import { create } from 'zustand';
interface SuccessType {
    success: string | null;
    setSuccess: (msg: string | null) => void;
    clearSuccess: () => void;
}
const useSuccessStore = create<SuccessType>((set) => ({
    success: null,
    setSuccess: (msg) => set({ success: msg }),
    clearSuccess: () => set({ success: null }),
}));
export default useSuccessStore;
