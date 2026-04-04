export interface RegisterData {
    email: string;
    password: string;
}
export interface User {
    id: string;
    phone: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
}
export type AuthResponse = {
    accessToken: string;
    user: User;
    message: string;
};
