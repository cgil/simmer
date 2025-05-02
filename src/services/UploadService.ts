import { supabase } from "../lib/supabase";

export interface GcsUploadResponse {
    signedUrl: string;
    permanentUrl: string;
}

export interface ImageUploadState {
    id: string;
    file?: File;
    previewUrl?: string;
    status: "pending" | "uploading" | "success" | "error";
    permanentUrl?: string;
    error?: string;
}

/**
 * Service for handling image uploads to Google Cloud Storage
 */
export class UploadService {
    /**
     * Generates a signed URL for direct upload to Google Cloud Storage
     */
    static async generateUploadUrl(
        fileName: string,
        contentType: string,
    ): Promise<GcsUploadResponse> {
        const { data, error } = await supabase.functions.invoke(
            "generate-gcs-upload-url",
            {
                method: "POST",
                body: { fileName, contentType },
            },
        );

        if (error) {
            console.error("Error generating upload URL:", error);
            throw new Error(
                error.message || "Failed to get upload URL from server.",
            );
        }

        if (!data || !data.signedUrl || !data.permanentUrl) {
            console.error(
                "Invalid response from generate-gcs-upload-url function:",
                data,
            );
            throw new Error("Server returned invalid data for upload URL.");
        }

        return data as GcsUploadResponse;
    }

    /**
     * Uploads a file directly to Google Cloud Storage using a signed URL
     */
    static async uploadFileToGcs(
        signedUrl: string,
        file: File,
    ): Promise<Response> {
        const response = await fetch(signedUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });

        if (!response.ok) {
            let gcsError = `GCS upload failed with status ${response.status}`;
            try {
                const errorText = await response.text();
                gcsError += `: ${errorText}`;
            } catch {
                // Ignore if reading response body fails
            }
            console.error("GCS Upload Error:", gcsError);
            throw new Error(`Upload failed. Status: ${response.status}`);
        }

        return response;
    }

    /**
     * Uploads a file via Edge Function
     */
    static async uploadFileViaFunction(
        file: File,
    ): Promise<{ permanentUrl: string }> {
        // Upload file via multipart/form-data to Edge Function
        const formData = new FormData();
        formData.append("file", file);
        const { data, error } = await supabase.functions.invoke(
            "upload-user-image",
            {
                method: "POST",
                body: formData,
            },
        );

        if (error) {
            console.error("Error uploading file via Edge Function:", error);
            throw new Error(
                error.message || "Failed to upload file via Edge Function.",
            );
        }

        if (!data || !data.permanentUrl) {
            console.error(
                "Invalid response from upload-user-image function:",
                data,
            );
            throw new Error("Server returned invalid data for upload URL.");
        }

        return { permanentUrl: data.permanentUrl };
    }
}
