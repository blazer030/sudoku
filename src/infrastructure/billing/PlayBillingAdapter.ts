import { store, ProductType, Platform, ErrorCode, CdvPurchase } from "capacitor-plugin-cdv-purchase";
import type { Product as CdvProduct, Transaction } from "capacitor-plugin-cdv-purchase";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

const TIER_META = new Map<string, { tier: DonateTier; label: string }>([
    ["donate_coffee",      { tier: "coffee",      label: "Coffee" }],
    ["donate_lunch",       { tier: "lunch",       label: "Lunch" }],
    ["donate_coding_time", { tier: "coding_time", label: "Coding Time" }],
]);

const PRODUCT_IDS = Array.from(TIER_META.keys());

export class PlayBillingAdapter implements BillingService {
    private setupComplete = false;
    private cachedProducts = new Map<string, Product>();
    private productsReady: Promise<Product[]> | null = null;
    private resolveProductsWhenReady: ((products: Product[]) => void) | null = null;
    private pendingPurchases = new Map<string, (result: PurchaseResult) => void>();

    private ensureSetup(): void {
        if (this.setupComplete) return;
        this.setupComplete = true;
        store.register(PRODUCT_IDS.map((id) => ({
            id,
            type: ProductType.CONSUMABLE,
            platform: Platform.GOOGLE_PLAY,
        })));
        store.when()
            .productUpdated((product) => { this.handleProductUpdated(product); })
            .approved((transaction) => { this.handleApproved(transaction); });
        void store.initialize([Platform.GOOGLE_PLAY]);
    }

    loadProducts(): Promise<Product[]> {
        this.ensureSetup();
        this.productsReady ??= new Promise<Product[]>((resolve) => {
            this.resolveProductsWhenReady = resolve;
            this.maybeResolveProducts();
        });
        return this.productsReady;
    }

    purchase(productId: string): Promise<PurchaseResult> {
        this.ensureSetup();
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
        this.ensureSetup();
        for (const transaction of store.localTransactions) {
            if (transaction.state === CdvPurchase.TransactionState.APPROVED) {
                await transaction.finish();
            }
        }
    }

    private handleProductUpdated(product: CdvProduct): void {
        const meta = TIER_META.get(product.id);
        if (meta === undefined) return;
        const pricing = product.pricing;
        if (pricing === undefined) return;
        this.cachedProducts.set(product.id, {
            id: product.id,
            tier: meta.tier,
            label: meta.label,
            priceText: pricing.price,
            amountUsd: pricing.priceMicros / 1_000_000,
        });
        this.maybeResolveProducts();
    }

    private maybeResolveProducts(): void {
        if (this.resolveProductsWhenReady === null) return;
        if (this.cachedProducts.size < PRODUCT_IDS.length) return;
        const ordered = PRODUCT_IDS
            .map((id) => this.cachedProducts.get(id))
            .filter((entry): entry is Product => entry !== undefined);
        this.resolveProductsWhenReady(ordered);
        this.resolveProductsWhenReady = null;
    }

    private handleApproved(transaction: Transaction): void {
        if (transaction.products.length === 0) return;
        const productId = transaction.products[0].id;
        void transaction.finish();
        const resolve = this.pendingPurchases.get(productId);
        const product = this.cachedProducts.get(productId);
        if (resolve === undefined || product === undefined) return;
        this.pendingPurchases.delete(productId);
        resolve({ kind: "success", productId, tier: product.tier, amountUsd: product.amountUsd });
    }
}
