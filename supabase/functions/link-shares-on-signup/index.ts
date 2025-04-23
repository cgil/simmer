import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Link Shares On Signup function initializing");

interface AuthWebhookPayload {
    type: "INSERT" | "UPDATE" | "DELETE";
    table: string;
    schema: string;
    record: {
        id: string; // User ID
        email?: string;
        // other user fields...
    };
    old_record: unknown;
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: AuthWebhookPayload = await req.json();

        // Only process INSERT events for the auth.users table
        if (payload.type !== "INSERT" || payload.table !== "users") {
            console.log(
                "Received non-INSERT event or event for wrong table, skipping.",
            );
            return new Response(
                JSON.stringify({ message: "Skipped non-insert event" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 200,
                },
            );
        }

        const newUser = payload.record;
        if (!newUser || !newUser.id || !newUser.email) {
            console.error("Invalid user data received:", newUser);
            return new Response(
                JSON.stringify({ error: "Invalid user data" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 400,
                },
            );
        }

        const newUserId = newUser.id;
        const newUserEmail = newUser.email.toLowerCase(); // Normalize email

        console.log(
            `Processing signup for user ID: ${newUserId}, email: ${newUserEmail}`,
        );

        // Create a Supabase client with the Service Role Key for elevated privileges
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            },
        );

        // --- Process Pending Recipe Shares ---
        console.log("Checking for pending recipe shares...");
        const { data: pendingRecipeShares, error: recipeError } =
            await supabaseAdmin
                .from("shared_recipes")
                .select("id, recipe_id, access_level")
                .is("shared_with_user_id", null)
                .eq("lower(shared_with_email)", newUserEmail); // Case-insensitive match

        if (recipeError) {
            console.error("Error fetching pending recipe shares:", recipeError);
            throw recipeError;
        }

        if (pendingRecipeShares && pendingRecipeShares.length > 0) {
            console.log(
                `Found ${pendingRecipeShares.length} pending recipe shares for ${newUserEmail}`,
            );
            for (const pendingShare of pendingRecipeShares) {
                // Check if a share for this recipe already exists for the new user ID
                const {
                    data: existingUserShare,
                    error: existingRecipeCheckError,
                } = await supabaseAdmin
                    .from("shared_recipes")
                    .select("id, access_level")
                    .eq("recipe_id", pendingShare.recipe_id)
                    .eq("shared_with_user_id", newUserId)
                    .maybeSingle(); // Use maybeSingle as it might not exist

                if (existingRecipeCheckError) {
                    console.error(
                        `Error checking existing recipe share for recipe ${pendingShare.recipe_id}:`,
                        existingRecipeCheckError,
                    );
                    continue; // Skip this share if check fails
                }

                if (existingUserShare) {
                    console.log(
                        `Existing user share found for recipe ${pendingShare.recipe_id}. Deduplicating...`,
                    );
                    // Deduplication logic: Prefer 'edit' access
                    if (existingUserShare.access_level === "edit") {
                        // Existing user share has higher or equal privs, remove pending email share
                        console.log(
                            `  Existing share has edit access. Removing pending email share ${pendingShare.id}.`,
                        );
                        const { error: deletePendingError } =
                            await supabaseAdmin
                                .from("shared_recipes")
                                .delete()
                                .eq("id", pendingShare.id);
                        if (deletePendingError) {
                            console.error(
                                `  Error deleting pending recipe share ${pendingShare.id}:`,
                                deletePendingError,
                            );
                        }
                    } else if (pendingShare.access_level === "edit") {
                        // Pending email share has higher privs, remove existing user share and update pending
                        console.log(
                            `  Pending share has edit access. Removing existing user share ${existingUserShare.id}.`,
                        );
                        const { error: deleteExistingError } =
                            await supabaseAdmin
                                .from("shared_recipes")
                                .delete()
                                .eq("id", existingUserShare.id);
                        if (deleteExistingError) {
                            console.error(
                                `  Error deleting existing recipe share ${existingUserShare.id}:`,
                                deleteExistingError,
                            );
                        } else {
                            // Now update the pending share to link the user ID
                            console.log(
                                `  Updating pending recipe share ${pendingShare.id} with user ID ${newUserId}.`,
                            );
                            const { error: updateError } = await supabaseAdmin
                                .from("shared_recipes")
                                .update({
                                    shared_with_user_id: newUserId,
                                    shared_with_email: null,
                                }) // Clear email once linked
                                .eq("id", pendingShare.id);
                            if (updateError) {
                                console.error(
                                    `  Error updating pending recipe share ${pendingShare.id}:`,
                                    updateError,
                                );
                            }
                        }
                    } else {
                        // Both are 'view', remove the pending email share
                        console.log(
                            `  Both shares have view access. Removing pending email share ${pendingShare.id}.`,
                        );
                        const { error: deletePendingError } =
                            await supabaseAdmin
                                .from("shared_recipes")
                                .delete()
                                .eq("id", pendingShare.id);
                        if (deletePendingError) {
                            console.error(
                                `  Error deleting pending recipe share ${pendingShare.id}:`,
                                deletePendingError,
                            );
                        }
                    }
                } else {
                    // No existing user share, just update the pending share
                    console.log(
                        `Updating pending recipe share ${pendingShare.id} with user ID ${newUserId}.`,
                    );
                    const { error: updateError } = await supabaseAdmin
                        .from("shared_recipes")
                        .update({
                            shared_with_user_id: newUserId,
                            shared_with_email: null,
                        }) // Clear email once linked
                        .eq("id", pendingShare.id);
                    if (updateError) {
                        console.error(
                            `Error updating pending recipe share ${pendingShare.id}:`,
                            updateError,
                        );
                    }
                }
            }
        } else {
            console.log("No pending recipe shares found.");
        }

        // --- Process Pending Collection Shares ---
        console.log("Checking for pending collection shares...");
        const { data: pendingCollectionShares, error: collectionError } =
            await supabaseAdmin
                .from("shared_collections")
                .select("id, collection_id, access_level")
                .is("shared_with_user_id", null)
                .eq("lower(shared_with_email)", newUserEmail); // Case-insensitive match

        if (collectionError) {
            console.error(
                "Error fetching pending collection shares:",
                collectionError,
            );
            throw collectionError;
        }

        if (pendingCollectionShares && pendingCollectionShares.length > 0) {
            console.log(
                `Found ${pendingCollectionShares.length} pending collection shares for ${newUserEmail}`,
            );
            for (const pendingShare of pendingCollectionShares) {
                // Check if a share for this collection already exists for the new user ID
                const {
                    data: existingUserShare,
                    error: existingCollectionCheckError,
                } = await supabaseAdmin
                    .from("shared_collections")
                    .select("id, access_level")
                    .eq("collection_id", pendingShare.collection_id)
                    .eq("shared_with_user_id", newUserId)
                    .maybeSingle();

                if (existingCollectionCheckError) {
                    console.error(
                        `Error checking existing collection share for collection ${pendingShare.collection_id}:`,
                        existingCollectionCheckError,
                    );
                    continue; // Skip this share if check fails
                }

                if (existingUserShare) {
                    console.log(
                        `Existing user share found for collection ${pendingShare.collection_id}. Deduplicating...`,
                    );
                    // Deduplication logic: Prefer 'edit' access
                    if (existingUserShare.access_level === "edit") {
                        // Existing user share has higher or equal privs, remove pending email share
                        console.log(
                            `  Existing share has edit access. Removing pending email share ${pendingShare.id}.`,
                        );
                        const { error: deletePendingError } =
                            await supabaseAdmin
                                .from("shared_collections")
                                .delete()
                                .eq("id", pendingShare.id);
                        if (deletePendingError) {
                            console.error(
                                `  Error deleting pending collection share ${pendingShare.id}:`,
                                deletePendingError,
                            );
                        }
                    } else if (pendingShare.access_level === "edit") {
                        // Pending email share has higher privs, remove existing user share and update pending
                        console.log(
                            `  Pending share has edit access. Removing existing user share ${existingUserShare.id}.`,
                        );
                        const { error: deleteExistingError } =
                            await supabaseAdmin
                                .from("shared_collections")
                                .delete()
                                .eq("id", existingUserShare.id);
                        if (deleteExistingError) {
                            console.error(
                                `  Error deleting existing collection share ${existingUserShare.id}:`,
                                deleteExistingError,
                            );
                        } else {
                            // Now update the pending share to link the user ID
                            console.log(
                                `  Updating pending collection share ${pendingShare.id} with user ID ${newUserId}.`,
                            );
                            const { error: updateError } = await supabaseAdmin
                                .from("shared_collections")
                                .update({
                                    shared_with_user_id: newUserId,
                                    shared_with_email: null,
                                }) // Clear email once linked
                                .eq("id", pendingShare.id);
                            if (updateError) {
                                console.error(
                                    `  Error updating pending collection share ${pendingShare.id}:`,
                                    updateError,
                                );
                            }
                        }
                    } else {
                        // Both are 'view', remove the pending email share
                        console.log(
                            `  Both shares have view access. Removing pending email share ${pendingShare.id}.`,
                        );
                        const { error: deletePendingError } =
                            await supabaseAdmin
                                .from("shared_collections")
                                .delete()
                                .eq("id", pendingShare.id);
                        if (deletePendingError) {
                            console.error(
                                `  Error deleting pending collection share ${pendingShare.id}:`,
                                deletePendingError,
                            );
                        }
                    }
                } else {
                    // No existing user share, just update the pending share
                    console.log(
                        `Updating pending collection share ${pendingShare.id} with user ID ${newUserId}.`,
                    );
                    const { error: updateError } = await supabaseAdmin
                        .from("shared_collections")
                        .update({
                            shared_with_user_id: newUserId,
                            shared_with_email: null,
                        }) // Clear email once linked
                        .eq("id", pendingShare.id);
                    if (updateError) {
                        console.error(
                            `Error updating pending collection share ${pendingShare.id}:`,
                            updateError,
                        );
                    }
                }
            }
        } else {
            console.log("No pending collection shares found.");
        }

        console.log("Finished processing shares for user:", newUserId);
        return new Response(
            JSON.stringify({ message: "Shares linked successfully" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error processing signup webhook:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "An unknown error occurred";
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
