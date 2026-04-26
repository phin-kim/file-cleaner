export interface RegisterData {
    email: string;
    password: string;
}
export interface User {
    id: string;
    phone: string;
    email: string;
    name?: string;
    profileImageUrl?: string;
    role: 'user' | 'admin';
}
export type AuthResponse = {
    accessToken: string;
    user: User;
    message: string;
    createdAt: Date;
};
export type LoginResponse = {
    accessToken: string;
    user: User;
    message: string;
    createdAt: Date;
};

export type AuthState = {
    user: User | null;
    accessToken: string | null;
    _hasHydrated: boolean; //<-- used  as a flag to tell the pages to wait until the is authenticated is read from the local storage
    isAuthenticated: boolean;
    createdAt: Date | null;
    isLoading: boolean;
    notFound: boolean;
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    setNotFound: (state: boolean) => void;
    register: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    setHasHydrated: (state: boolean) => void;
    setAccessToken: (token: string | null) => void;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
};
