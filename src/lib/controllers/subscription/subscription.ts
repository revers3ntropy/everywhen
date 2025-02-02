export enum SubscriptionType {
    Free = 'subtype-free',
    Plus = 'subtype-plus'
}

export interface Pricing {
    price: number;
    name: string;
    lookupKey: string;
}

export interface SubscriptionInfo {
    stripeId: string;
    subType: SubscriptionType;
    costInPence: number;
    repeatInterval: string;
    active: boolean;
}
