// Helper to get a common file extension from a MIME type

const mimeToExtensionMap: Record<string, string> = {
    "image/jpeg": ".jpeg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    // Add other common types if needed
};

export function getMimeExtension(mimeType: string): string | null {
    if (!mimeType) return null;
    return mimeToExtensionMap[mimeType.toLowerCase()] || null;
}
