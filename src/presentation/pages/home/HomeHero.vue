<template>
    <div
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
import { useI18n } from "vue-i18n";
import { titleGlyphs } from "@/presentation/pages/home/titleGlyphs";

const { t } = useI18n();
</script>
