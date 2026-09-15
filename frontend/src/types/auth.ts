import { authClient } from '../lib/auth-client';

export interface RegisterData {
    email: string;
    password: string;
}
export type LoginResponse = Awaited<ReturnType<typeof authClient.signIn.email>>;

export interface User {
    id: string;
    phone?: string;
    email: string;
    name?: string;
    profileImageUrl?: string;
    role?: string;
    createdAt?: Date;
}
export type AuthResponse = {
    accessToken: string;
    user: User;
    message: string;
    createdAt: Date;
};
/*export type LoginResponse = {
    accessToken: string;
    user: User;
    message: string;
    createdAt: Date;
};*/

export type AuthState = {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    createdAt: Date | null;
    isLoading: boolean;
    notFound: boolean;
    requestPasswordReset: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    setNotFound: (state: boolean) => void;
    register: (name: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<LoginResponse>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
};
