import { defineStore } from "pinia";
import { ref } from "vue";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

export const useDonateStore = defineStore("donate", () => {
    const products = ref<Product[]>([]);
    const purchasing = ref<string | null>(null);
    const lastResult = ref<PurchaseResult | null>(null);
    let billing: BillingService | null = null;

    const setBilling = (service: BillingService) => {
        billing = service;
    };

    const loadProducts = async () => {
        if (billing === null) return;
        await billing.consumeAll();
        products.value = await billing.loadProducts();
    };

    const purchase = async (productId: string) => {
        if (billing === null) return;
        if (purchasing.value !== null) return;
        purchasing.value = productId;
        try {
            lastResult.value = await billing.purchase(productId);
        } finally {
            purchasing.value = null;
        }
    };

    return { products, purchasing, lastResult, setBilling, loadProducts, purchase };
});
