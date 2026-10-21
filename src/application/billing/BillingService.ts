import type { InjectionKey } from "vue";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

export interface Product {
    id: string;          // Play SKU e.g. "donate_coffee"
    tier: DonateTier;    // "coffee" | "lunch" | "coding_time"
    label: string;       // "Coffee"
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

export const BILLING_KEY: InjectionKey<BillingService> = Symbol("BillingService");
