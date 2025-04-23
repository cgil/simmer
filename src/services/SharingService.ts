import { supabase } from "../lib/supabase";

/**
 * Type representing the item types that can be shared
 */
export type ShareableItemType = "recipe" | "collection";

/**
 * Access level enum for shared items
 */
export type AccessLevel = "view" | "edit";

/**
 * Interface for user with access to a shared item
 */
export interface SharedUser {
    id: string;
    email: string;
    avatarUrl?: string;
    access: AccessLevel;
    shareId: string; // The ID of the share record for operations
    isCurrentUser?: boolean;
}

/**
 * Interface for item owner information
 */
export interface ItemOwner {
    id: string;
    email: string;
    avatarUrl?: string;
}

/**
 * Interface for share details returned to the frontend
 */
export interface ShareDetails {
    itemId: string;
    itemType: ShareableItemType;
    itemTitle: string;
    isPublic: boolean;
    owner: ItemOwner;
    sharedUsers: SharedUser[];
}

// Define common interfaces for item data to fix type errors
interface RecipeData {
    title: string;
    is_public: boolean;
    user_id: string;
}

interface CollectionData {
    name: string;
    is_public: boolean;
    user_id: string;
}

// Define user data interface based on public.users table structure
interface UserData {
    id: string;
    email: string;
    avatar_url?: string; // Direct avatar_url from public.users
}

/**
 * Service to handle all sharing-related functionality
 */
export class SharingService {
    /**
     * Get sharing details for an item
     * @param itemId - ID of the recipe or collection
     * @param itemType - Type of item ('recipe' or 'collection')
     * @returns Share details including owner, shared users, and public status
     */
    static async getShareDetails(
        itemId: string,
        itemType: ShareableItemType,
    ): Promise<ShareDetails | null> {
        try {
            const currentUser = supabase.auth.getUser();
            const currentUserId = (await currentUser).data.user?.id;

            if (!currentUserId) {
                throw new Error(
                    "User must be authenticated to view sharing details",
                );
            }

            // 1. Fetch the item details (title and is_public status)
            let itemData: RecipeData | CollectionData | null = null;
            let error;
            let itemTitle = "";
            let isPublic = true;
            let ownerId = "";

            if (itemType === "recipe") {
                ({ data: itemData, error } = await supabase
                    .from("recipes")
                    .select("title, is_public, user_id")
                    .eq("id", itemId)
                    .single());
            } else {
                ({ data: itemData, error } = await supabase
                    .from("collections")
                    .select("name, is_public, user_id")
                    .eq("id", itemId)
                    .single());
            }

            if (error || !itemData) {
                console.error(`Error fetching ${itemType} details:`, error);
                return null;
            }

            // Set title based on itemType (recipes have 'title', collections have 'name')
            if (itemType === "recipe" && "title" in itemData) {
                itemTitle = itemData.title;
            } else if (itemType === "collection" && "name" in itemData) {
                itemTitle = itemData.name;
            }

            isPublic = itemData.is_public;
            ownerId = itemData.user_id;

            // 2. Get owner details
            const { data: ownerData, error: ownerError } = await supabase
                .from("users")
                .select("email, avatar_url")
                .eq("id", ownerId)
                .single();

            if (ownerError) {
                console.error("Error fetching owner details:", ownerError);
                // Continue anyway - we at least have the owner ID
            }

            // 3. Get shared users and their details
            const sharesTable = itemType === "recipe"
                ? "shared_recipes"
                : "shared_collections";
            const itemIdField = itemType === "recipe"
                ? "recipe_id"
                : "collection_id";

            const { data: shares, error: sharesError } = await supabase
                .from(sharesTable)
                .select(`
                    id,
                    access_level,
                    shared_with_user_id,
                    shared_with_email
                `)
                .eq(itemIdField, itemId);

            if (sharesError) {
                console.error(
                    `Error fetching ${itemType} shares:`,
                    sharesError,
                );
                // Continue with empty shares
            }

            // Get user details for each share that has a user ID
            const sharedUserIds = shares
                ?.filter((share) => share.shared_with_user_id)
                .map((share) => share.shared_with_user_id) || [];

            let usersData: UserData[] = [];
            if (sharedUserIds.length > 0) {
                const { data: users, error: usersError } = await supabase
                    .from("users")
                    .select("id, email, avatar_url")
                    .in("id", sharedUserIds);

                if (usersError) {
                    console.error(
                        "Error fetching shared users details:",
                        usersError,
                    );
                } else {
                    usersData = users || [];
                }
            }

            // 4. Construct the response
            const owner: ItemOwner = {
                id: ownerId,
                email: ownerData?.email || "Unknown",
                avatarUrl: ownerData?.avatar_url || undefined,
            };

            const sharedUsers: SharedUser[] = shares?.map((share) => {
                // If user_id exists, find user details from usersData
                if (share.shared_with_user_id) {
                    const userData = usersData.find((u) =>
                        u.id === share.shared_with_user_id
                    );
                    if (userData) {
                        return {
                            id: userData.id,
                            email: userData.email,
                            avatarUrl: userData.avatar_url,
                            access: share.access_level as AccessLevel,
                            shareId: share.id,
                            isCurrentUser: userData.id === currentUserId,
                        };
                    }
                }

                // If no user_id or no matching user data, use just the email
                return {
                    id: share.id, // Use share ID as a fallback
                    email: share.shared_with_email || "Unknown",
                    access: share.access_level as AccessLevel,
                    shareId: share.id,
                    isCurrentUser: false,
                };
            }) || [];

            return {
                itemId,
                itemType,
                itemTitle,
                isPublic,
                owner,
                sharedUsers,
            };
        } catch (error) {
            console.error(
                `Error in getShareDetails for ${itemType} ${itemId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Share an item with a user by email
     * @param itemId - ID of the recipe or collection
     * @param itemType - Type of item ('recipe' or 'collection')
     * @param email - Email address to share with
     * @param accessLevel - Permission level to grant ('view' or 'edit')
     * @returns Boolean indicating success
     */
    static async shareWithUser(
        itemId: string,
        itemType: ShareableItemType,
        email: string,
        accessLevel: AccessLevel,
    ): Promise<boolean> {
        try {
            const currentUser = supabase.auth.getUser();
            const currentUserId = (await currentUser).data.user?.id;

            if (!currentUserId) {
                throw new Error("User must be authenticated to share items");
            }

            // Normalize email to lowercase
            const normalizedEmail = email.toLowerCase().trim();

            // First, check if this user already exists in the system
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, email")
                .ilike("email", normalizedEmail)
                .maybeSingle();

            if (userError) {
                console.error("Error checking if user exists:", userError);
                // Continue anyway, we'll just use the email
            }

            const userId = userData?.id;
            const sharesTable = itemType === "recipe"
                ? "shared_recipes"
                : "shared_collections";
            const itemIdField = itemType === "recipe"
                ? "recipe_id"
                : "collection_id";

            // Check if a share already exists for this email or user ID
            const { data: existingShares, error: existingShareError } =
                await supabase
                    .from(sharesTable)
                    .select("id, access_level")
                    .or(`shared_with_email.ilike.${normalizedEmail}${
                        userId ? `,shared_with_user_id.eq.${userId}` : ""
                    }`)
                    .eq(itemIdField, itemId);

            if (existingShareError) {
                console.error(
                    "Error checking existing shares:",
                    existingShareError,
                );
                throw existingShareError;
            }

            // If a share exists, update the access level if it's different from the current one
            if (existingShares && existingShares.length > 0) {
                const existingShare = existingShares[0];

                // Update access level if it's different from the current one
                if (existingShare.access_level !== accessLevel) {
                    const { error: updateError } = await supabase
                        .from(sharesTable)
                        .update({ access_level: accessLevel })
                        .eq("id", existingShare.id);

                    if (updateError) {
                        console.error(
                            "Error updating share access level:",
                            updateError,
                        );
                        throw updateError;
                    }
                }

                // Share already exists, no need to create a new one
                return true;
            }

            // Create a new share record
            const shareData = {
                [itemIdField]: itemId,
                shared_with_email: normalizedEmail,
                shared_with_user_id: userId || null,
                access_level: accessLevel,
                granted_by_user_id: currentUserId,
            };

            const { error: insertError } = await supabase
                .from(sharesTable)
                .insert(shareData);

            if (insertError) {
                console.error("Error creating share:", insertError);
                throw insertError;
            }

            return true;
        } catch (error) {
            console.error(
                `Error in shareWithUser for ${itemType} ${itemId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Update access level for a shared item
     * @param shareId - ID of the share record
     * @param itemType - Type of item ('recipe' or 'collection')
     * @param newAccessLevel - New permission level to set ('view' or 'edit')
     * @returns Boolean indicating success
     */
    static async updateAccessLevel(
        shareId: string,
        itemType: ShareableItemType,
        newAccessLevel: AccessLevel,
    ): Promise<boolean> {
        try {
            const sharesTable = itemType === "recipe"
                ? "shared_recipes"
                : "shared_collections";

            const { error } = await supabase
                .from(sharesTable)
                .update({ access_level: newAccessLevel })
                .eq("id", shareId);

            if (error) {
                console.error(
                    `Error updating access level for ${itemType} share ${shareId}:`,
                    error,
                );
                throw error;
            }

            return true;
        } catch (error) {
            console.error(
                `Error in updateAccessLevel for ${itemType} share ${shareId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Remove user access to a shared item
     * @param shareId - ID of the share record
     * @param itemType - Type of item ('recipe' or 'collection')
     * @returns Boolean indicating success
     */
    static async removeAccess(
        shareId: string,
        itemType: ShareableItemType,
    ): Promise<boolean> {
        try {
            const sharesTable = itemType === "recipe"
                ? "shared_recipes"
                : "shared_collections";

            const { error } = await supabase
                .from(sharesTable)
                .delete()
                .eq("id", shareId);

            if (error) {
                console.error(
                    `Error removing access for ${itemType} share ${shareId}:`,
                    error,
                );
                throw error;
            }

            return true;
        } catch (error) {
            console.error(
                `Error in removeAccess for ${itemType} share ${shareId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Update the public status of an item
     * @param itemId - ID of the recipe or collection
     * @param itemType - Type of item ('recipe' or 'collection')
     * @param isPublic - New public status to set
     * @returns Boolean indicating success
     */
    static async updatePublicStatus(
        itemId: string,
        itemType: ShareableItemType,
        isPublic: boolean,
    ): Promise<boolean> {
        try {
            const table = itemType === "recipe" ? "recipes" : "collections";

            const { error } = await supabase
                .from(table)
                .update({ is_public: isPublic })
                .eq("id", itemId);

            if (error) {
                console.error(
                    `Error updating public status for ${itemType} ${itemId}:`,
                    error,
                );
                throw error;
            }

            return true;
        } catch (error) {
            console.error(
                `Error in updatePublicStatus for ${itemType} ${itemId}:`,
                error,
            );
            throw error;
        }
    }
}
