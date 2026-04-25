import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
    profilePic: string | null;
    //userEmail: string;
    setProfilePic: (pic: string | null) => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            profilePic: null,
            //userEmail: 'phinehasnjuguna1@gmail.com', // From user metadata
            setProfilePic: (pic) => set({ profilePic: pic }),
        }),
        {
            name: 'profile-storage',
        }
    )
);
