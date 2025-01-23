export enum SubscriptionType {
    Free = 'subtype-free',
    Plus = 'subtype-plus'
}

export const plusLookupKeys = {
    [SubscriptionType.Free]: '',
    [SubscriptionType.Plus]: 'ew_plus_monthly_v2'
} satisfies Record<SubscriptionType, string>;

export interface SubscriptionInfo {
    stripeId: string;
    subType: SubscriptionType;
    costInPence: number;
    repeatInterval: string;
    active: boolean;
}
