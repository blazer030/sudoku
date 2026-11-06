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
            class="grid grid-cols-[auto_auto] gap-x-3 gap-y-3.5 items-start mr-1 [@media(max-height:800px)]:gap-y-2.5 home-short:gap-y-1.5"
            data-skin="hero-vertical"
            data-testid="home-hero-emblem"
        >
            <span
                class="row-span-2 pt-7.5 text-[15px] [letter-spacing:.35em] text-foreground-secondary [writing-mode:vertical-rl] [@media(max-height:800px)]:pt-5 [@media(max-height:800px)]:text-[13px] [@media(max-height:800px)]:[letter-spacing:.25em] home-short:pt-2.5 home-short:text-xs home-tiny:hidden"
                data-skin="hero-subtitle"
            >{{ EMBLEM.subtitle }}</span>
            <span
                class="text-[78px] leading-none [letter-spacing:.06em] font-normal text-foreground [writing-mode:vertical-rl] [@media(max-height:800px)]:text-[48px] home-short:text-[40px] home-tiny:text-[32px]"
                data-skin="hero-title"
            >{{ EMBLEM.title }}</span>
            <span
                class="col-start-2 justify-self-center grid place-items-center size-[42px] text-[15px] leading-[1.05] font-black rotate-[-4deg] bg-primary text-on-primary rounded-sm [writing-mode:vertical-rl] [@media(max-height:800px)]:size-9 [@media(max-height:800px)]:text-[13px] home-short:size-[30px] home-short:text-[11px] home-tiny:hidden"
                data-skin="hero-seal"
            >{{ EMBLEM.title }}</span>
        </div>
    </div>
    <!-- The title written large with no logo above it, its letters spaced apart; a style draws under it -->
    <div
        v-else-if="layout === 'headline'"
        class="flex flex-col items-center"
        data-skin="hero-headline"
        data-testid="home-hero"
    >
        <h1
            class="text-foreground text-[66px] home-short:text-[48px] leading-[1.1] font-bold [letter-spacing:.08em] mr-[-.08em]"
            data-skin="title"
        >
            <span
                v-for="(glyph, glyphIndex) in titleGlyphs(t('home.title'))"
                :key="glyphIndex"
                data-skin="title-glyph"
                data-testid="home-title-glyph"
            >{{ glyph }}</span>
        </h1>
        <p
            class="mt-7 home-short:mt-3 text-foreground-secondary text-base home-short:text-sm"
            data-skin="home-subtitle"
        >
            {{ t("home.subtitle") }}
        </p>
    </div>
    <!-- The stacked logo over a light, large title and the subtitle, both spaced out by letter-spacing properties
         as the emblem above; the title gives its trailing space back, so it stays centred -->
    <div
        v-else-if="layout === 'spaced'"
        class="flex flex-col items-center gap-2 home-short:gap-1"
        data-testid="home-hero"
    >
        <div
            class="size-(--home-logo-size) bg-primary rounded-popup flex items-center justify-center shadow-primary-lg"
            data-skin="logo"
            data-testid="home-logo"
        >
            <div class="grid grid-cols-3 gap-1 size-(--home-logo-mark)">
                <div
                    v-for="square in 9"
                    :key="square"
                    :class="square % 2 === 0 ? 'bg-on-primary' : 'bg-on-primary/40'"
                    class="rounded-sm"
                />
            </div>
        </div>
        <h1
            class="text-foreground text-[44px] home-short:text-[34px] home-short:leading-[44px] font-light [letter-spacing:.5em] mr-[-.5em]"
            data-skin="title"
        >
            <span
                v-for="(glyph, glyphIndex) in titleGlyphs(t('home.title'))"
                :key="glyphIndex"
                data-skin="title-glyph"
                data-testid="home-title-glyph"
            >{{ glyph }}</span>
        </h1>
        <p
            class="text-foreground-secondary text-sm [letter-spacing:.2em]"
            data-skin="home-subtitle"
        >
            {{ t("home.subtitle") }}
        </p>
    </div>
    <div
        v-else
        class="flex flex-col items-center gap-2"
        data-testid="home-hero"
    >
        <div
            class="size-(--home-logo-size) bg-primary rounded-popup flex items-center justify-center shadow-primary-lg"
            data-skin="logo"
            data-testid="home-logo"
        >
            <div class="grid grid-cols-3 gap-1 size-(--home-logo-mark)">
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
            class="text-foreground text-4xl home-short:text-[28px] home-short:leading-8 font-bold tracking-[-1px]"
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
        <p
            class="text-foreground-secondary text-sm home-short:text-xs"
            data-skin="home-subtitle"
        >
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
