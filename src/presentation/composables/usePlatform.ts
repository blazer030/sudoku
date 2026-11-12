import { Capacitor } from "@capacitor/core";

export const usePlatform = () => ({
    isNative: Capacitor.isNativePlatform(),
});
