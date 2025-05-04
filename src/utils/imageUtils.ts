/**
 * Utilities for handling images, blobs, and data URIs.
 */

/**
 * Converts a Data URI string (e.g., "data:image/png;base64,...") to a Blob object.
 * @param dataURI The Data URI string.
 * @returns A Blob object representing the image data, or null if conversion fails.
 */
export const dataURIToBlob = (dataURI: string): Blob | null => {
    try {
        // Split metadata from data
        const byteString = atob(dataURI.split(",")[1]);

        // Extract mime type
        const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

        // Write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // Create the Blob
        return new Blob([ab], { type: mimeString });
    } catch (error) {
        console.error("Error converting Data URI to Blob:", error);
        return null;
    }
};
