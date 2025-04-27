import { useEffect } from "react";

// Type definitions for experimental browser APIs & external library

// Wake Lock API (not yet in TS lib)
interface WakeLockSentinel {
    released: boolean;
    release: () => Promise<void>;
    addEventListener: (
        type: "release",
        listener: () => void,
        options?: boolean | AddEventListenerOptions,
    ) => void;
    removeEventListener: (
        type: "release",
        listener: () => void,
        options?: boolean | EventListenerOptions,
    ) => void;
}

type WakeLockNavigator = Navigator & {
    wakeLock: {
        request: (type: "screen") => Promise<WakeLockSentinel>;
    };
};

/**
 * useWakeLock hook
 *
 * Prevents the screen from dimming / locking on mobile devices while the provided
 * `enabled` flag is true. It first attempts to use the Screen Wake-Lock API
 * (supported on most modern Chrome / Android browsers). If that isn't available
 * — e.g. on iOS Safari — it falls back to the small `nosleep.js` technique that
 * keeps the device awake by playing a tiny, invisible looping video.
 *
 * The wake-lock is automatically released when the component using the hook
 * unmounts or when `enabled` changes to `false`.
 */
const useWakeLock = (enabled: boolean = true) => {
    useEffect(() => {
        if (!enabled) return;

        // Very simple mobile detection – ensures we don't activate this on desktop
        const isMobileDevice = typeof navigator !== "undefined" &&
            /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        if (!isMobileDevice) return;

        let wakeLock: WakeLockSentinel | null = null;
        interface NoSleepInstance {
            enable: () => void;
            disable: () => void;
        }

        let noSleep: NoSleepInstance | null = null;
        let isActive = true; // Guard to avoid actions after cleanup

        const requestWakeLock = async () => {
            try {
                if ("wakeLock" in navigator) {
                    const wlNavigator = navigator as WakeLockNavigator;
                    wakeLock = await wlNavigator.wakeLock.request("screen");

                    // Re-acquire the lock if it is released for any reason (page hidden, etc.)
                    // Some platforms (Android) may release it automatically.
                    wakeLock?.addEventListener("release", () => {
                        if (isActive) {
                            requestWakeLock().catch(console.error);
                        }
                    });
                } else {
                    // Fallback for browsers without the WakeLock API (e.g. iOS Safari)
                    const nsModule = await import("nosleep.js");
                    const NoSleepClass =
                        (nsModule as { default?: new () => NoSleepInstance })
                            .default ??
                            (nsModule as unknown as new () => NoSleepInstance);
                    noSleep = new NoSleepClass();
                    noSleep.enable();
                }
            } catch (err) {
                console.error("[useWakeLock] Failed to acquire wake lock", err);
            }
        };

        requestWakeLock().catch(console.error);

        // Re-request the lock whenever the tab becomes visible again.
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                requestWakeLock().catch(console.error);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isActive = false;
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            if (wakeLock) {
                wakeLock.release().catch(() => null);
                wakeLock = null;
            }
            if (noSleep && typeof noSleep.disable === "function") {
                noSleep.disable();
                noSleep = null;
            }
        };
    }, [enabled]);
};

export default useWakeLock;
