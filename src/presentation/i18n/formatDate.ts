import type { AppLocale } from "@/application/SettingsStorage";
import { i18n } from "@/presentation/i18n";

const MILLISECONDS_PER_DAY = 86400000;

const pad = (value: number): string => String(value).padStart(2, "0");

// zh-Hant builds its own text: Intl output differs by platform (e.g. adds 下午)
const formatTime = (date: Date, locale: AppLocale): string => {
    if (locale === "en") {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatMonthDay = (date: Date, locale: AppLocale): string => {
    if (locale === "en") {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const formatDate = (dateString: string, locale: AppLocale, now: Date = new Date()): string => {
    const date = new Date(dateString);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gameDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - gameDay.getTime()) / MILLISECONDS_PER_DAY);

    const time = formatTime(date, locale);

    if (diffDays === 0) return i18n.global.t("date.today", { time }, { locale });
    if (diffDays === 1) return i18n.global.t("date.yesterday", { time }, { locale });
    return i18n.global.t("date.other", { date: formatMonthDay(date, locale), time }, { locale });
};
