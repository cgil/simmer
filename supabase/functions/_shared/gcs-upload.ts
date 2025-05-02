import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { encodeUrl } from "https://deno.land/x/encodeurl@1.0.0/mod.ts";

const GCS_BUCKET_NAME = Deno.env.get("GCS_BUCKET_NAME");
const GCS_CLIENT_EMAIL = Deno.env.get("GCS_CLIENT_EMAIL");
const GCS_PRIVATE_KEY_PEM = Deno.env.get("GCS_PRIVATE_KEY");

if (!GCS_BUCKET_NAME || !GCS_CLIENT_EMAIL || !GCS_PRIVATE_KEY_PEM) {
    console.error("Missing GCS configuration environment variables.");
    // In a real scenario, you might want to throw an error or handle this differently
    // depending on whether the function absolutely requires GCS to operate.
}

// Helper function to import the PEM private key
async function importPrivateKey(pem: string): Promise<CryptoKey> {
    // Remove PEM header and footer, and line breaks
    const pemContents = pem
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\s+/g, "");

    // Decode base64
    const binaryDer = Uint8Array.from(
        atob(pemContents),
        (c) => c.charCodeAt(0),
    );

    try {
        return await crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
            },
            true, // Must be true for signing
            ["sign"],
        );
    } catch (error) {
        console.error("Error importing private key:", error);
        throw new Error("Failed to import GCS private key.");
    }
}

// Helper function to create a JWT for OAuth2 token exchange
async function createJwt(
    serviceAccountEmail: string,
    privateKey: CryptoKey,
    audience: string,
    expiresInSeconds: number = 3600, // 1 hour
): Promise<string> {
    const header = { alg: "RS256", typ: "JWT" };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresInSeconds;
    const payload = {
        iss: serviceAccountEmail,
        sub: serviceAccountEmail,
        aud: audience,
        iat: iat,
        exp: exp,
        scope: "https://www.googleapis.com/auth/devstorage.read_write", // Scope needed for metadata update
    };

    const unsignedToken = `${base64Encode(JSON.stringify(header))}.${
        base64Encode(JSON.stringify(payload))
    }`;

    const signatureBuffer = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        new TextEncoder().encode(unsignedToken),
    );
    const signature = base64Encode(signatureBuffer).replace(/\+/g, "-").replace(
        /\//g,
        "_",
    ).replace(/=+$/, ""); // URL-safe Base64

    return `${unsignedToken}.${signature}`;
}

// Helper function to get an OAuth2 access token
async function getAccessToken(): Promise<string> {
    if (!GCS_CLIENT_EMAIL || !GCS_PRIVATE_KEY_PEM) {
        throw new Error(
            "GCS configuration is incomplete for getting access token.",
        );
    }

    const privateKey = await importPrivateKey(GCS_PRIVATE_KEY_PEM);
    const tokenAudience = "https://oauth2.googleapis.com/token";
    const jwt = await createJwt(GCS_CLIENT_EMAIL, privateKey, tokenAudience);

    const response = await fetch(tokenAudience, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(
            `Error fetching GCS access token (${response.status}): ${errorText}`,
        );
        throw new Error("Failed to get GCS access token.");
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Uploads data (Uint8Array or Blob) directly to GCS using the service account.
 * Prefer using signed URLs for client-side uploads when possible.
 * This is useful for backend functions uploading generated content.
 */
export async function uploadDataToGCS(
    data: Uint8Array | Blob,
    destinationPath: string,
    contentType: string,
    metadata?: Record<string, string>,
): Promise<string> { // Returns the permanent URL
    if (!GCS_BUCKET_NAME) {
        throw new Error("GCS bucket name is not configured.");
    }

    const accessToken = await getAccessToken();
    const encodedObjectPath = encodeUrl(destinationPath); // Ensure path is URL-safe
    const uploadUrl =
        `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET_NAME}/o?uploadType=media&name=${encodedObjectPath}`;
    const permanentUrl =
        `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${destinationPath}`;

    const headers: HeadersInit = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": contentType,
        // GCS requires Content-Length for direct media uploads
        "Content-Length": data instanceof Uint8Array
            ? data.byteLength.toString()
            : data.size.toString(),
    };

    // Add metadata if provided using special headers
    if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
            headers[`x-goog-meta-${key.toLowerCase()}`] = value;
        });
    }

    const response = await fetch(uploadUrl, {
        method: "POST", // Use POST for simple media uploads
        headers: headers,
        body: data,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(
            `Error uploading data to GCS path ${destinationPath} (${response.status}): ${errorText}`,
        );
        throw new Error(`Failed to upload data directly to GCS: ${errorText}`);
    }

    return permanentUrl; // Return the final URL of the uploaded object
}

// Optional: Add uploadToGCS function if needed later by other backend functions
// export async function uploadToGCS(...) { ... }
