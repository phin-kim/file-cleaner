export interface Tier {
    id: string;
    name: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    description: string;
    features: string[];
    highlight: boolean;
    icon: React.ReactNode; // or JSX.Element
}
export type PaymentMethod = {
    id: 'mpesa' | 'card' | 'paypal';
    name: string;
    icon: React.ReactNode;
};
