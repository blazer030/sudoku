import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Donate from "@/presentation/pages/donate/Donate.vue";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { useDonateStore } from "@/stores/donateStore";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

const fakeProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", label: "Coffee", priceText: "$2.99", amountUsd: 2.99 },
];

const buildBilling = (purchaseResult: PurchaseResult): BillingService => ({
    loadProducts: vi.fn().mockResolvedValue(fakeProducts),
    purchase: vi.fn().mockResolvedValue(purchaseResult),
    consumeAll: vi.fn().mockResolvedValue(undefined),
});

const mountDonate = (analytics: AnalyticsService, billing: BillingService) => {
    setActivePinia(createPinia());
    useDonateStore().setBilling(billing);

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/donate", component: Donate },
        ],
    });

    return mount(Donate, {
        global: {
            plugins: [router],
            provide: { [ANALYTICS_KEY as symbol]: analytics },
        },
    });
};

describe("Donate.vue analytics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("emits donate_view on mount", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const billing = buildBilling({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        });
        mountDonate({ logEvent }, billing);
        await flushPromises();

        expect(logEvent).toHaveBeenCalledWith({ name: "donate_view" });
    });

    it("emits donate_tap when a tier is tapped", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const billing = buildBilling({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        });
        const wrapper = mountDonate({ logEvent }, billing);
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(logEvent).toHaveBeenCalledWith({ name: "donate_tap", tier: "coffee" });
    });

    it("emits donate_success after a successful purchase", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const billing = buildBilling({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        });
        const wrapper = mountDonate({ logEvent }, billing);
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(logEvent).toHaveBeenCalledWith({
            name: "donate_success",
            tier: "coffee",
            amount_usd: 2.99,
        });
    });

    it("does not emit donate_success when purchase is cancelled", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const billing = buildBilling({ kind: "cancelled" });
        const wrapper = mountDonate({ logEvent }, billing);
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        const successCalls = logEvent.mock.calls.filter(([event]) => (event as { name: string }).name === "donate_success");
        expect(successCalls).toHaveLength(0);
    });
});
