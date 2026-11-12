import { DONATE_TIERS, productIdOf, type BillingService, type DonateTier, type Product, type PurchaseResult } from "@/application/billing/BillingService";

const FAKE_PRICES_USD: Record<DonateTier, number> = { coffee: 2.99, lunch: 5.99, coding_time: 9.99 };

const FAKE_PRODUCTS: Product[] = DONATE_TIERS.map(tier => ({
    id: productIdOf(tier),
    tier,
    priceText: "$" + FAKE_PRICES_USD[tier].toFixed(2),
    amountUsd: FAKE_PRICES_USD[tier],
}));

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
