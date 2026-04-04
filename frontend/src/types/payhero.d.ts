declare interface PayHeroStatic {
    init: (opts: any) => void;
}

export {};

declare global {
    interface Window {
        PayHero?: PayHeroStatic;
    }
}
