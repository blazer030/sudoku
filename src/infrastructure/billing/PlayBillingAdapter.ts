import { store, ProductType, Platform, ErrorCode, CdvPurchase } from "capacitor-plugin-cdv-purchase";
import type { Transaction } from "capacitor-plugin-cdv-purchase";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

const TIER_META = new Map<string, { tier: DonateTier; label: string }>([
    ["donate_coffee",      { tier: "coffee",      label: "Coffee" }],
    ["donate_lunch",       { tier: "lunch",       label: "Lunch" }],
    ["donate_coding_time", { tier: "coding_time", label: "Coding Time" }],
]);

const PRODUCT_IDS = Array.from(TIER_META.keys());

export class PlayBillingAdapter implements BillingService {
    private initialization: Promise<unknown> | null = null;
    private hasLoadedProducts = false;
    private pendingPurchases = new Map<string, (result: PurchaseResult) => void>();

    private ensureSetup(): Promise<unknown> {
        if (this.initialization !== null) return this.initialization;
        store.register(PRODUCT_IDS.map((id) => ({
            id,
            type: ProductType.CONSUMABLE,
            platform: Platform.GOOGLE_PLAY,
        })));
        store.when()
            .approved((transaction) => { this.handleApproved(transaction); });
        // Only user-initiated retries call store.update(), so never throttle them
        store.minTimeBetweenUpdates = 0;
        this.initialization = store.initialize([Platform.GOOGLE_PLAY]);
        return this.initialization;
    }

    async loadProducts(): Promise<Product[]> {
        await this.ensureSetup();
        if (this.hasLoadedProducts && this.availableProducts().length < PRODUCT_IDS.length) {
            await store.update();
        }
        this.hasLoadedProducts = true;
        return this.availableProducts();
    }

    // Read from the store directly: its productUpdated callbacks fire on a later tick than initialize() resolves
    private availableProducts(): Product[] {
        return PRODUCT_IDS
            .map((id) => this.toProduct(id))
            .filter((entry): entry is Product => entry !== undefined);
    }

    private toProduct(productId: string): Product | undefined {
        const meta = TIER_META.get(productId);
        const pricing = store.get(productId, Platform.GOOGLE_PLAY)?.pricing;
        if (meta === undefined || pricing === undefined) return undefined;
        return {
            id: productId,
            tier: meta.tier,
            label: meta.label,
            priceText: pricing.price,
            amountUsd: pricing.priceMicros / 1_000_000,
        };
    }

    purchase(productId: string): Promise<PurchaseResult> {
        void this.ensureSetup();
        const product = store.get(productId, Platform.GOOGLE_PLAY);
        const offer = product?.getOffer();
        if (offer === undefined) {
            return Promise.resolve({ kind: "error", reason: "Product not available" });
        }
        return new Promise<PurchaseResult>((resolve) => {
            this.pendingPurchases.set(productId, resolve);
            void offer.order().then((error) => {
                if (error === undefined) return;
                this.pendingPurchases.delete(productId);
                if (error.code === ErrorCode.PAYMENT_CANCELLED) {
                    resolve({ kind: "cancelled" });
                } else {
                    resolve({ kind: "error", reason: error.message });
                }
            });
        });
    }

    async consumeAll(): Promise<void> {
        void this.ensureSetup();
        for (const transaction of store.localTransactions) {
            if (transaction.state === CdvPurchase.TransactionState.APPROVED) {
                await transaction.finish();
            }
        }
    }

    private handleApproved(transaction: Transaction): void {
        if (transaction.products.length === 0) return;
        const productId = transaction.products[0].id;
        void transaction.finish();
        const resolve = this.pendingPurchases.get(productId);
        const product = this.toProduct(productId);
        if (resolve === undefined || product === undefined) return;
        this.pendingPurchases.delete(productId);
        resolve({ kind: "success", productId, tier: product.tier, amountUsd: product.amountUsd });
    }
}
