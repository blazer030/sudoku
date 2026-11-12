/** The donation tiers, from the smallest. */
export const DONATE_TIERS = ["coffee", "lunch", "coding_time"] as const;
export type DonateTier = typeof DONATE_TIERS[number];

/** A tier's Play Console product id, always `donate_<tier>`. */
export const productIdOf = (tier: DonateTier): string => `donate_${tier}`;

export interface Product {
    id: string;          // Play SKU, productIdOf(tier)
    tier: DonateTier;
    priceText: string;   // "$2.99" or localized equivalent
    amountUsd: number;   // 2.99
}

export type PurchaseResult =
    | { kind: "success"; productId: string; tier: DonateTier; amountUsd: number }
    | { kind: "cancelled" }
    | { kind: "error"; reason: string };

export interface BillingService {
    loadProducts(): Promise<Product[]>;
    purchase(productId: string): Promise<PurchaseResult>;
    consumeAll(): Promise<void>;
}
