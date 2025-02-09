/**
 * Formats a number of minutes into a human-readable string showing days, hours and minutes
 * @param minutes - The number of minutes to format
 * @returns A formatted string like "2 days 3 hours 30 minutes" or "45 minutes"
 */
export const formatTimeDisplay = (minutes: number): string => {
    // Handle edge cases
    if (minutes === 0) return '0 mins';
    if (minutes < 0) return '0 mins';
    if (!Number.isFinite(minutes)) return '0 mins';

    // If less than 60 minutes, just show minutes
    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
    }

    const days = Math.floor(minutes / (24 * 60));
    const remainingHours = Math.floor((minutes % (24 * 60)) / 60);
    const remainingMinutes = minutes % 60;

    const parts: string[] = [];

    // Add days if we have them
    if (days > 0) {
        parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }

    // Add hours if we have them
    if (remainingHours > 0) {
        parts.push(`${remainingHours} ${remainingHours === 1 ? 'hr' : 'hrs'}`);
    }

    // Add minutes if we have them
    if (remainingMinutes > 0) {
        parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? 'min' : 'mins'}`);
    }

    return parts.join(' ');
};
