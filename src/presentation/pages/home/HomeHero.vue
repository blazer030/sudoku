<template>
    <!-- The title set vertically at the right, the subtitle down its left and a seal under it: an emblem,
         always in Chinese (marked so, which sets its CJK faces as in Chinese), so it is hidden from screen
         readers, which read the heading in the player's language instead. Its letter-spacing is set as a
         property, not by tracking-*, which Chinese pages drop: the emblem is spaced alike in both languages. -->
    <div
        v-if="layout === 'vertical'"
        class="flex justify-end w-full"
        data-testid="home-hero"
    >
        <h1 class="sr-only">
            {{ t("home.title") }}
        </h1>
        <p class="sr-only">
            {{ t("home.subtitle") }}
        </p>
        <div
            aria-hidden="true"
            lang="zh-Hant"
            class="grid grid-cols-[auto_auto] gap-x-3 gap-y-3.5 items-start mr-1 [@media(max-height:740px)]:gap-y-2.5"
            data-skin="hero-vertical"
            data-testid="home-hero-emblem"
        >
            <span
                class="row-span-2 pt-7.5 text-[15px] [letter-spacing:.35em] text-foreground-secondary [writing-mode:vertical-rl] [@media(max-height:740px)]:pt-5 [@media(max-height:740px)]:text-[13px] [@media(max-height:740px)]:[letter-spacing:.25em]"
                data-skin="hero-subtitle"
            >{{ EMBLEM.subtitle }}</span>
            <span
                class="text-[78px] leading-none [letter-spacing:.06em] font-normal text-foreground [writing-mode:vertical-rl] [@media(max-height:740px)]:text-[48px]"
                data-skin="hero-title"
            >{{ EMBLEM.title }}</span>
            <span
                class="col-start-2 justify-self-center grid place-items-center size-[42px] text-[15px] leading-[1.05] font-black rotate-[-4deg] bg-primary text-on-primary rounded-sm [writing-mode:vertical-rl] [@media(max-height:740px)]:size-9 [@media(max-height:740px)]:text-[13px]"
                data-skin="hero-seal"
            >{{ EMBLEM.title }}</span>
        </div>
    </div>
    <div
        v-else
        class="flex flex-col items-center gap-2"
        data-testid="home-hero"
    >
        <div
            class="w-20 h-20 bg-primary rounded-popup flex items-center justify-center shadow-primary-lg"
            data-skin="logo"
            data-testid="home-logo"
        >
            <div class="grid grid-cols-3 gap-1 w-12 h-12">
                <div class="rounded-sm bg-on-primary/40" />
                <div class="rounded-sm bg-on-primary" />
                <div class="rounded-sm bg-on-primary/40" />
                <div class="rounded-sm bg-on-primary" />
                <div class="rounded-sm bg-on-primary/40" />
                <div class="rounded-sm bg-on-primary" />
                <div class="rounded-sm bg-on-primary/40" />
                <div class="rounded-sm bg-on-primary" />
                <div class="rounded-sm bg-on-primary/40" />
            </div>
        </div>
        <h1
            class="text-foreground text-4xl font-bold tracking-[-1px]"
            data-skin="title"
        >
            <!-- One span per plate; the heading's text is unchanged, so it reads as before -->
            <span
                v-for="(glyph, glyphIndex) in titleGlyphs(t('home.title'))"
                :key="glyphIndex"
                data-skin="title-glyph"
                data-testid="home-title-glyph"
            >{{ glyph }}</span>
        </h1>
        <p class="text-foreground-secondary text-sm">
            {{ t("home.subtitle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settingsStore";
import { zhHant } from "@/presentation/i18n/messages/zh-Hant";
import { STYLE_HOME_HEROES } from "@/presentation/pages/home/homeHeroes";
import { titleGlyphs } from "@/presentation/pages/home/titleGlyphs";

const { t } = useI18n();
const settings = useSettingsStore();

const layout = computed(() => STYLE_HOME_HEROES[settings.style]);

// The vertical emblem reads as calligraphy, so it stays Chinese in every language
const EMBLEM = { title: zhHant.home.title, subtitle: zhHant.home.subtitle };
</script>
