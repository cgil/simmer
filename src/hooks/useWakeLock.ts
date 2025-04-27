import { useCallback, useEffect, useRef, useState } from "react";
import logger from "../utils/logger"; // Assuming logger exists

// Check for Wake Lock API support only once
const isWakeLockSupported = typeof navigator !== "undefined" &&
    "wakeLock" in navigator;

// Simple check for mobile/tablet based on touch capability
const isMobileOrTablet = typeof navigator !== "undefined" &&
    navigator.maxTouchPoints > 0;

/**
 * A React hook to manage the Screen Wake Lock API, specifically for mobile/tablet devices.
 * Keeps the screen awake when the component using the hook is mounted and visible.
 *
 * @param {string} reason - Optional reason for requesting the wake lock.
 * @returns {object} An object containing the wake lock status information.
 *                   - isSupported: boolean - Whether the Wake Lock API is supported.
 *                   - isActive: boolean - Whether the wake lock is currently active.
 *                   - requestError: Error | null - Any error encountered during request.
 */
const useWakeLock = (reason: string = "Screen Wake Lock active") => {
    // const [isSupported, setIsSupported] = useState<boolean>(
    //     typeof navigator !== "undefined" && "wakeLock" in navigator,
    // );
    const [isActive, setIsActive] = useState<boolean>(false);
    const [requestError, setRequestError] = useState<Error | null>(null);
    const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);

    const requestWakeLock = useCallback(async () => {
        // Only proceed if API is supported AND it's a mobile/tablet device
        if (!isWakeLockSupported || !isMobileOrTablet) {
            if (isMobileOrTablet) {
                logger.log("Wake Lock API not supported on this device.");
            } else {
                // Don't log anything if it's not mobile/tablet, as it's expected behaviour
            }
            return;
        }

        // Prevent multiple requests
        if (wakeLockSentinel.current) {
            logger.log("Wake Lock already active or request pending.");
            return;
        }

        try {
            wakeLockSentinel.current = await navigator.wakeLock.request(
                "screen",
            );
            setIsActive(true);
            setRequestError(null);
            logger.log("Wake Lock acquired successfully:", reason);

            // Handle release event (e.g., system constraints)
            wakeLockSentinel.current.addEventListener("release", () => {
                logger.log("Wake Lock released externally.");
                // Check if the sentinel reference still matches before clearing
                if (wakeLockSentinel.current === wakeLockSentinel.current) {
                    wakeLockSentinel.current = null;
                    setIsActive(false);
                }
            });
        } catch (err) {
            setIsActive(false);
            if (err instanceof Error) {
                setRequestError(err);
                logger.error(
                    "Failed to acquire Wake Lock:",
                    err.name,
                    err.message,
                );
            } else {
                setRequestError(
                    new Error(
                        "An unknown error occurred during wake lock request.",
                    ),
                );
                logger.error(
                    "Failed to acquire Wake Lock with unknown error:",
                    err,
                );
            }
            wakeLockSentinel.current = null; // Ensure sentinel is null on error
        }
    }, [reason]);

    const releaseWakeLock = useCallback(async () => {
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
        } else {
            // logger.log('No active Wake Lock to release.');
        }
    }, []);

    // Effect to handle initial request and cleanup
    useEffect(() => {
        // Only request if supported, mobile/tablet, and document is visible
        if (
            isWakeLockSupported && isMobileOrTablet &&
            document.visibilityState === "visible"
        ) {
            requestWakeLock();
        }

        // Cleanup function to release lock on unmount
        return () => {
            releaseWakeLock();
        };
    }, [requestWakeLock, releaseWakeLock]);

    // Effect to handle visibility changes
    useEffect(() => {
        const handleVisibilityChange = async () => {
            // Only handle visibility if API is supported AND it's mobile/tablet
            if (!isWakeLockSupported || !isMobileOrTablet) return;

            if (document.visibilityState === "visible") {
                // If returning to visibility and lock is not active/pending, request it again
                if (!wakeLockSentinel.current) {
                    logger.log(
                        "Re-acquiring Wake Lock due to visibility change.",
                    );
                    await requestWakeLock();
                }
            } else {
                // If page becomes hidden, release the lock
                logger.log("Releasing Wake Lock due to visibility change.");
                await releaseWakeLock();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("pagehide", releaseWakeLock); // Also release on page hide

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            document.removeEventListener("pagehide", releaseWakeLock);
        };
    }, [requestWakeLock, releaseWakeLock]);

    // Return API support status regardless of device type, but active status depends on both
    return { isSupported: isWakeLockSupported, isActive, requestError };
};

export default useWakeLock;
