import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

const FAKE_PRODUCTS: Product[] = [
    { id: "donate_coffee",       tier: "coffee",       label: "Coffee",      priceText: "$2.99", amountUsd: 2.99 },
    { id: "donate_lunch",        tier: "lunch",        label: "Lunch",       priceText: "$5.99", amountUsd: 5.99 },
    { id: "donate_coding_time",  tier: "coding_time",  label: "Coding Time", priceText: "$9.99", amountUsd: 9.99 },
];

export class NoopBillingAdapter implements BillingService {
    loadProducts(): Promise<Product[]> {
        return Promise.resolve(FAKE_PRODUCTS);
    }

    purchase(productId: string): Promise<PurchaseResult> {
        const product = FAKE_PRODUCTS.find((candidate) => candidate.id === productId);
        if (product === undefined) {
            return Promise.resolve({ kind: "error", reason: "Unknown product" });
        }
        return Promise.resolve({ kind: "success", productId, tier: product.tier, amountUsd: product.amountUsd });
    }

    consumeAll(): Promise<void> {
        return Promise.resolve();
    }
}
