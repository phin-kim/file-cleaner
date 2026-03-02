export interface RegisterData {
    email: string;
    password: string;
}
export interface User {
    id: string;
    email: string;
    role: 'user' | 'admin';
}
export type AuthResponse = {
    accessToken: string;
    user: User;
    message: string;
};
