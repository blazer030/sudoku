<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background overflow-y-auto">
        <div class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">
                    Back
                </span>
            </button>
            <span class="text-foreground text-lg font-semibold">
                Support
            </span>
            <div class="w-15" />
        </div>

        <p class="text-foreground-muted text-[15px] leading-relaxed">
            Sudoku is 100% free, no ads.<br>
            If you'd like to support development:
        </p>

        <div class="bg-card rounded-2xl shadow-card-sm divide-y divide-border">
            <button
                v-for="product in store.products"
                :key="product.id"
                class="flex items-center justify-between w-full px-4 py-4 cursor-pointer disabled:opacity-50"
                :disabled="store.purchasing !== null"
                :data-testid="`donate-tier-${product.tier}`"
                @click="onTap(product)"
            >
                <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ emojiFor(product.tier) }}</span>
                    <span class="text-foreground text-[15px] font-medium">
                        {{ product.label }}
                    </span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-foreground-muted text-[15px]">
                        {{ product.priceText }}
                    </span>
                    <ChevronRight
                        :size="18"
                        class="text-foreground-muted"
                    />
                </div>
            </button>
        </div>

        <p class="text-foreground-muted text-[12px] text-center">
            Payments handled by Google Play
        </p>

        <DonateSuccess
            v-if="successTier !== null"
            :tier="successTier"
            @done="dismissSuccess"
        />
    </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { useDonateStore } from "@/stores/donateStore";
import { ANALYTICS_KEY, type DonateTier } from "@/application/analytics/AnalyticsService";
import type { Product } from "@/application/billing/BillingService";
import DonateSuccess from "@/presentation/pages/donate/components/DonateSuccess.vue";

const router = useRouter();
const store = useDonateStore();
const analytics = inject(ANALYTICS_KEY);
const successTier = ref<DonateTier | null>(null);

const TIER_EMOJI: Record<DonateTier, string> = {
    coffee: "☕",
    lunch: "🍱",
    coding_time: "💻",
};

const emojiFor = (tier: DonateTier) => TIER_EMOJI[tier];

const goBack = () => {
    router.back();
};

const onTap = async (product: Product) => {
    void analytics?.logEvent({ name: "donate_tap", tier: product.tier });
    await store.purchase(product.id);
};

const dismissSuccess = () => {
    successTier.value = null;
};

watch(() => store.lastResult, (result) => {
    if (result?.kind === "success") {
        successTier.value = result.tier;
        void analytics?.logEvent({
            name: "donate_success",
            tier: result.tier,
            amount_usd: result.amountUsd,
        });
    }
});

onMounted(async () => {
    void analytics?.logEvent({ name: "donate_view" });
    await store.loadProducts();
});
</script>
