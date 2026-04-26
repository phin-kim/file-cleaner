import { create } from 'zustand';

interface ProfileState {
    profilePic: string | null;
    //userEmail: string;
    setProfilePic: (pic: string | null) => void;
    clearProfilePic: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
    profilePic: null,
    setProfilePic: (pic) => set({ profilePic: pic }),
    clearProfilePic: () => set({ profilePic: null }),
}));
