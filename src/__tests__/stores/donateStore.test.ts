import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useDonateStore } from "@/stores/donateStore";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

const sampleProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", label: "Coffee", priceText: "$2.99", amountUsd: 2.99 },
];

const mockBilling = (overrides: Partial<BillingService> = {}): BillingService => ({
    loadProducts: vi.fn().mockResolvedValue(sampleProducts),
    purchase: vi.fn().mockResolvedValue({
        kind: "success",
        productId: "donate_coffee",
        tier: "coffee",
        amountUsd: 2.99,
    } satisfies PurchaseResult),
    consumeAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

describe("donateStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("starts with empty products, no purchase in flight, no result", () => {
        const store = useDonateStore();
        expect(store.products).toEqual([]);
        expect(store.purchasing).toBeNull();
        expect(store.lastResult).toBeNull();
    });

    it("loadProducts consumes leftover purchases then fetches via billing service", async () => {
        const store = useDonateStore();
        const consumeAll = vi.fn().mockResolvedValue(undefined);
        const loadProducts = vi.fn().mockResolvedValue(sampleProducts);
        store.setBilling(mockBilling({ consumeAll, loadProducts }));

        await store.loadProducts();

        expect(consumeAll).toHaveBeenCalled();
        expect(loadProducts).toHaveBeenCalled();
        expect(store.products).toEqual(sampleProducts);
    });

    it("purchase resolves to success and stores the result", async () => {
        const store = useDonateStore();
        store.setBilling(mockBilling());

        await store.purchase("donate_coffee");

        expect(store.purchasing).toBeNull();
        expect(store.lastResult).toEqual({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        });
    });

    it("blocks concurrent purchases", async () => {
        const store = useDonateStore();
        const purchaseFn = vi.fn().mockImplementation(
            () => new Promise<PurchaseResult>((resolve) => setTimeout(() => { resolve({ kind: "cancelled" }); }, 10))
        );
        store.setBilling(mockBilling({ purchase: purchaseFn }));

        const first = store.purchase("donate_coffee");
        const second = store.purchase("donate_lunch");

        await Promise.all([first, second]);
        expect(purchaseFn).toHaveBeenCalledTimes(1);
    });

    it("records cancelled result", async () => {
        const store = useDonateStore();
        store.setBilling(mockBilling({
            purchase: vi.fn().mockResolvedValue({ kind: "cancelled" } satisfies PurchaseResult),
        }));

        await store.purchase("donate_coffee");

        expect(store.lastResult).toEqual({ kind: "cancelled" });
    });

    it("records error result", async () => {
        const store = useDonateStore();
        store.setBilling(mockBilling({
            purchase: vi.fn().mockResolvedValue({ kind: "error", reason: "Network failure" } satisfies PurchaseResult),
        }));

        await store.purchase("donate_coffee");

        expect(store.lastResult).toEqual({ kind: "error", reason: "Network failure" });
    });
});
