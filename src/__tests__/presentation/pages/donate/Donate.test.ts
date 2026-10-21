import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Donate from "@/presentation/pages/donate/Donate.vue";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { useDonateStore } from "@/stores/donateStore";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

const fakeProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", priceText: "$2.99", amountUsd: 2.99 },
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
            { path: "/settings", component: { template: "<div />" } },
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

describe("Donate.vue product loading", () => {
    it("shows a loading state instead of tiers or retry while products are being fetched", async () => {
        let finishLoading: (products: Product[]) => void = () => undefined;
        const billing: BillingService = {
            ...buildBilling({ kind: "cancelled" }),
            loadProducts: vi.fn(() => new Promise<Product[]>((resolve) => { finishLoading = resolve; })),
        };
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, billing);
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-loading']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='donate-retry']").exists()).toBe(false);

        finishLoading(fakeProducts);
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-loading']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='donate-tier-coffee']").exists()).toBe(true);
    });

    it("replaces the retry button with the loading state while a retry is in flight", async () => {
        let finishRetry: (products: Product[]) => void = () => undefined;
        const billing: BillingService = {
            ...buildBilling({ kind: "cancelled" }),
            loadProducts: vi.fn()
                .mockResolvedValueOnce([])
                .mockImplementationOnce(() => new Promise<Product[]>((resolve) => { finishRetry = resolve; })),
        };
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, billing);
        await flushPromises();

        await wrapper.find("[data-testid='donate-retry']").trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-loading']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='donate-retry']").exists()).toBe(false);
        finishRetry(fakeProducts);
        await flushPromises();
    });

    it("offers a retry when no products load, and shows the tiers once a retry succeeds", async () => {
        const billing: BillingService = {
            ...buildBilling({ kind: "cancelled" }),
            loadProducts: vi.fn().mockResolvedValueOnce([]).mockResolvedValue(fakeProducts),
        };
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, billing);
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-tier-coffee']").exists()).toBe(false);

        await wrapper.find("[data-testid='donate-retry']").trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-tier-coffee']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='donate-retry']").exists()).toBe(false);
    });
});

describe("Donate.vue purchase feedback", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows a Cancelled toast when the purchase is cancelled", async () => {
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, buildBilling({ kind: "cancelled" }));
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-toast']").text()).toBe("Cancelled");
    });

    it("shows a generic error toast and logs the reason when the purchase fails", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const wrapper = mountDonate(
            { logEvent: vi.fn().mockResolvedValue(undefined) },
            buildBilling({ kind: "error", reason: "Service disconnected" }),
        );
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-toast']").text()).toBe("Purchase failed. Please try again.");
        expect(consoleError).toHaveBeenCalledWith("Donate purchase failed:", "Service disconnected");
    });
});

describe("Donate.vue success screen", () => {
    it("returns to Settings when Done is tapped", async () => {
        const billing = buildBilling({ kind: "success", productId: "donate_coffee", tier: "coffee", amountUsd: 2.99 });
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, billing);
        const router = wrapper.vm.$router;
        await router.push("/settings");
        await router.push("/donate");
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();
        await wrapper.find("[data-testid='donate-success-done']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/settings");
    });
});

describe("Donate.vue zh-Hant", () => {
    const useChinese = async () => {
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
    };

    it("shows the two-line intro in Chinese", async () => {
        await useChinese();
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, buildBilling({ kind: "cancelled" }));
        await flushPromises();

        expect(wrapper.text()).toContain("數獨完全免費，沒有廣告。");
        expect(wrapper.text()).toContain("如果你想支持開發：");
    });

    it("shows the tier name in Chinese while keeping the Google Play price text", async () => {
        await useChinese();
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, buildBilling({ kind: "cancelled" }));
        await flushPromises();

        const tier = wrapper.find("[data-testid='donate-tier-coffee']");
        expect(tier.text()).toContain("一杯咖啡");
        expect(tier.text()).toContain("$2.99");
    });

    it("shows the cancelled toast in Chinese", async () => {
        await useChinese();
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, buildBilling({ kind: "cancelled" }));
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='donate-toast']").text()).toBe("已取消");
    });

    it("shows the thank-you sentence in Chinese on the success screen", async () => {
        await useChinese();
        const billing = buildBilling({ kind: "success", productId: "donate_coffee", tier: "coffee", amountUsd: 2.99 });
        const wrapper = mountDonate({ logEvent: vi.fn().mockResolvedValue(undefined) }, billing);
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(wrapper.text()).toContain("謝謝你請我喝咖啡！");
    });
});
