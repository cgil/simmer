import { useCallback, useEffect, useRef, useState } from "react";
import logger from "../utils/logger"; // Assuming logger exists
import NoSleep from "nosleep.js"; // Lightweight library for iOS fallback

// Check for Wake Lock API support only once
const isWakeLockSupported = typeof navigator !== "undefined" &&
    "wakeLock" in navigator;

// Simple check for mobile/tablet based on touch capability
const isMobileOrTablet = typeof navigator !== "undefined" &&
    navigator.maxTouchPoints > 0;

/**
 * A React hook to manage keeping the screen awake on mobile/tablet devices.
 * 1. Uses the Screen Wake Lock API when available.
 * 2. Falls back to NoSleep.js (hidden looping video) on iOS Safari & other browsers without support.
 */
const useWakeLock = (reason: string = "Screen Wake Lock active") => {
    const [isActive, setIsActive] = useState<boolean>(false);
    const [requestError, setRequestError] = useState<Error | null>(null);

    // References to wake-lock sentinel or NoSleep instance
    const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);
    const noSleepRef = useRef<NoSleep | null>(null);

    const enableNoSleep = useCallback(() => {
        try {
            if (!noSleepRef.current) {
                noSleepRef.current = new NoSleep();
            }
            noSleepRef.current.enable();
            setIsActive(true);
            logger.log("NoSleep fallback enabled:", reason);
        } catch (err) {
            setRequestError(err as Error);
            logger.error("Failed to enable NoSleep fallback:", err);
        }
    }, [reason]);

    const disableNoSleep = useCallback(() => {
        try {
            noSleepRef.current?.disable();
            setIsActive(false);
            logger.log("NoSleep fallback disabled");
        } catch (err) {
            logger.error("Error disabling NoSleep fallback:", err);
        }
    }, []);

    const requestWakeLock = useCallback(async () => {
        // Only attempt on mobile/tablet devices
        if (!isMobileOrTablet) return;

        if (isWakeLockSupported) {
            // Use native API
            if (wakeLockSentinel.current) return; // Already active
            try {
                wakeLockSentinel.current = await navigator.wakeLock.request(
                    "screen",
                );
                setIsActive(true);
                setRequestError(null);
                logger.log("Wake Lock acquired successfully:", reason);

                // Handle system release
                wakeLockSentinel.current.addEventListener("release", () => {
                    logger.log("Wake Lock released externally.");
                    wakeLockSentinel.current = null;
                    setIsActive(false);
                });
            } catch (err) {
                setIsActive(false);
                setRequestError(err as Error);
                logger.error("Failed to acquire Wake Lock:", err);
            }
        } else {
            // Fallback to NoSleep.js (requires user gesture to start video on iOS)
            enableNoSleep();
        }
    }, [enableNoSleep, reason]);

    const releaseWakeLock = useCallback(async () => {
        if (isWakeLockSupported) {
            if (wakeLockSentinel.current) {
                try {
                    await wakeLockSentinel.current.release();
                    logger.log("Wake Lock released programmatically.");
                } catch (err) {
                    logger.error("Failed to release Wake Lock:", err);
                } finally {
                    wakeLockSentinel.current = null;
                    setIsActive(false);
                }
            }
        } else {
            // Disable NoSleep fallback
            disableNoSleep();
        }
    }, [disableNoSleep]);

    // Effect to handle initial request when visible
    useEffect(() => {
        if (!isMobileOrTablet) return; // Only mobile/tablet

        if (document.visibilityState === "visible") {
            // For devices/browsers requiring user interaction (iOS), defer to first touch/click
            if (!isWakeLockSupported) {
                const handleFirstInteraction = () => {
                    requestWakeLock();
                    document.removeEventListener(
                        "touchstart",
                        handleFirstInteraction,
                    );
                    document.removeEventListener(
                        "click",
                        handleFirstInteraction,
                    );
                };
                document.addEventListener(
                    "touchstart",
                    handleFirstInteraction,
                    { once: true },
                );
                document.addEventListener("click", handleFirstInteraction, {
                    once: true,
                });
            } else {
                requestWakeLock();
            }
        }

        return () => {
            releaseWakeLock();
        };
    }, [requestWakeLock, releaseWakeLock]);

    // Re-acquire/release on visibility change
    useEffect(() => {
        if (!isMobileOrTablet) return;

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible") {
                requestWakeLock();
            } else {
                await releaseWakeLock();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("pagehide", releaseWakeLock);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            document.removeEventListener("pagehide", releaseWakeLock);
        };
    }, [requestWakeLock, releaseWakeLock]);

    return {
        isSupported: isWakeLockSupported || !!noSleepRef.current,
        isActive,
        requestError,
    };
};

export default useWakeLock;
