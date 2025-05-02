import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { uploadDataToGCS } from "../_shared/gcs-upload.ts";
import { getMimeExtension } from "../_shared/mime-helpers.ts"; // Assuming we create this helper

// Simple environment-aware logger (copy from recipe-creation or define inline)
const isProduction = Deno.env.get("ENVIRONMENT") === "production";
const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) console.log("[Info]", ...args);
    },
    warn: (...args: unknown[]) => {
        if (!isProduction) console.warn("[Warn]", ...args);
    },
    error: (...args: unknown[]) => {
        console.error("[Error]", ...args);
    },
};

// List of allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

serve(async (req: Request) => {
    logger.log(
        `upload-user-image: Received ${req.method} request for ${req.url}`,
    );

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        logger.log("upload-user-image: Handling OPTIONS preflight request.");
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Ensure the request method is POST
    if (req.method !== "POST") {
        logger.warn(`upload-user-image: Method Not Allowed (${req.method})`);
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        // 1. Authenticate the user
        const authorization = req.headers.get("Authorization");
        if (!authorization) {
            logger.error("upload-user-image: Missing authorization header.");
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }
        const token = authorization.replace("Bearer ", "");

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        if (!supabaseUrl || !supabaseAnonKey) {
            logger.error(
                "upload-user-image: Missing Supabase config env vars.",
            );
            return new Response(
                JSON.stringify({
                    error: "Internal Server Error: Missing Supabase config",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await supabase.auth
            .getUser(token);

        if (authError || !user) {
            logger.error("upload-user-image: Auth error:", authError);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        logger.log(`upload-user-image: Authenticated user ${user.id}`);

        // 2. Parse body: support FormData upload, JSON base64 payload, or raw binary
        const contentTypeHeader = req.headers.get("Content-Type") || "";
        let contentType: string;
        let fileDataBytes: Uint8Array;
        if (contentTypeHeader.startsWith("multipart/form-data")) {
            // Handle multipart/form-data from browser FormData
            const form = await req.formData();
            const fileEntry = form.get("file");
            if (!(fileEntry instanceof Blob)) {
                return new Response(
                    JSON.stringify({
                        error: "Invalid or missing file in form-data",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }
            const fileBlob = fileEntry as Blob;
            contentType = fileBlob.type;
            fileDataBytes = new Uint8Array(await fileBlob.arrayBuffer());
        } else if (contentTypeHeader.includes("application/json")) {
            // JSON body: { fileData: base64String, contentType: mimeType }
            const jsonBody = await req.json();
            contentType = jsonBody.contentType;
            const rawBase64 = jsonBody.fileData as string;
            fileDataBytes = Uint8Array.from(
                atob(rawBase64),
                (c) => c.charCodeAt(0),
            );
        } else {
            // Raw binary body
            contentType = contentTypeHeader;
            const arrayBuffer = await req.arrayBuffer();
            fileDataBytes = new Uint8Array(arrayBuffer);
        }
        // 3. Validate Content-Type
        if (
            !contentType ||
            !ALLOWED_IMAGE_TYPES.includes(contentType.toLowerCase())
        ) {
            logger.warn(
                `upload-user-image: Invalid content type: ${contentType}`,
            );
            return new Response(
                JSON.stringify({
                    error: `Invalid content type. Allowed: ${
                        ALLOWED_IMAGE_TYPES.join(", ")
                    }`,
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }
        // 4. Get file extension and generate path
        const fileExtension = getMimeExtension(contentType);
        if (!fileExtension) {
            logger.error(
                `upload-user-image: Unknown MIME type: ${contentType}`,
            );
            return new Response(
                JSON.stringify({
                    error: "Cannot determine file extension from content type.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }
        const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
        const destinationPath = `uploads/${user.id}/${uniqueFileName}`;
        logger.log(`upload-user-image: Generated GCS path: ${destinationPath}`);
        // 5. File size checks based on parsed data
        if (fileDataBytes.byteLength === 0) {
            logger.warn(`upload-user-image: Received empty file data.`);
            return new Response(
                JSON.stringify({ error: "Received empty file." }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }
        if (fileDataBytes.byteLength > MAX_FILE_SIZE_BYTES) {
            logger.warn(
                `upload-user-image: File size exceeds limit (${fileDataBytes.byteLength} > ${MAX_FILE_SIZE_BYTES})`,
            );
            return new Response(
                JSON.stringify({
                    error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`,
                }),
                {
                    status: 413,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }
        // 6. Upload to GCS using parsed data
        logger.log(
            `upload-user-image: Calling uploadDataToGCS for ${destinationPath}`,
        );
        const permanentUrl = await uploadDataToGCS(
            fileDataBytes, // Pass in parsed bytes
            destinationPath,
            contentType,
        );
        logger.log(
            `upload-user-image: Upload successful. URL: ${permanentUrl}`,
        );

        // 7. Return the permanent URL
        return new Response(JSON.stringify({ permanentUrl }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        logger.error("upload-user-image: Unhandled error:", error);
        let errorMessage = "Internal Server Error";
        if (error instanceof Error) {
            errorMessage = error.message; // Provide more specific error if available
            // Log specific known errors differently if needed
            if (
                errorMessage.includes("Failed to upload data directly to GCS")
            ) {
                logger.error(
                    "upload-user-image: GCS upload failed within uploadDataToGCS.",
                    error,
                );
            }
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
