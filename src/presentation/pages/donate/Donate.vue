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

        <div
            v-if="store.loadFailed"
            class="flex flex-col items-center gap-3 bg-card rounded-2xl shadow-card-sm px-4 py-6"
        >
            <span class="text-foreground-muted text-[15px]">
                Couldn't load donation options.
            </span>
            <button
                class="px-5 py-2 rounded-button bg-primary text-white text-[15px] font-medium cursor-pointer hover:bg-primary-hover"
                data-testid="donate-retry"
                @click="retryLoad"
            >
                Retry
            </button>
        </div>

        <div
            v-else
            class="bg-card rounded-2xl shadow-card-sm divide-y divide-border"
        >
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

        <Transition name="toast">
            <div
                v-if="toastMessage !== null"
                class="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 bg-foreground text-background text-sm px-4 py-3 rounded-xl shadow-lg max-w-[90%]"
                data-testid="donate-toast"
            >
                {{ toastMessage }}
            </div>
        </Transition>

        <DonateSuccess
            v-if="successTier !== null"
            :tier="successTier"
            @done="dismissSuccess"
        />
    </div>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
const toastMessage = ref<string | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const TOAST_DURATION = 2500;

const TIER_EMOJI: Record<DonateTier, string> = {
    coffee: "☕",
    lunch: "🍱",
    coding_time: "💻",
};

const emojiFor = (tier: DonateTier) => TIER_EMOJI[tier];

const showToast = (message: string) => {
    if (toastTimeout !== null) clearTimeout(toastTimeout);
    toastMessage.value = message;
    toastTimeout = setTimeout(() => {
        toastMessage.value = null;
        toastTimeout = null;
    }, TOAST_DURATION);
};

const goBack = () => {
    router.back();
};

const onTap = async (product: Product) => {
    void analytics?.logEvent({ name: "donate_tap", tier: product.tier });
    await store.purchase(product.id);
};

const retryLoad = async () => {
    await store.loadProducts();
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
    } else if (result?.kind === "cancelled") {
        showToast("Cancelled");
    } else if (result?.kind === "error") {
        console.error("Donate purchase failed:", result.reason);
        showToast("Purchase failed. Please try again.");
    }
});

onBeforeUnmount(() => {
    if (toastTimeout !== null) clearTimeout(toastTimeout);
});

onMounted(async () => {
    void analytics?.logEvent({ name: "donate_view" });
    await store.loadProducts();
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: opacity 200ms ease, transform 200ms ease;
}
.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translate(-50%, 10px);
}
</style>
