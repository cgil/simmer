/**
 * UUID utility functions using the uuid library
 */
import { v4 as uuidv4, v5 as uuidv5, validate as uuidValidate } from "uuid";

// Namespace for our application's UUIDs
// This will be used as the namespace for generating UUID v5
const SIMMER_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

/**
 * Generates a random UUID v4
 * @returns A random UUID v4 string
 */
export const generateUuidV4 = (): string => {
    return uuidv4();
};

/**
 * Generates a deterministic UUID v5 based on a name
 * This will always generate the same UUID for the same input name
 *
 * @param name The name to generate a UUID for (e.g., ingredient slug)
 * @param namespace Optional namespace UUID to use (defaults to SIMMER_NAMESPACE)
 * @returns A deterministic UUID v5 string
 */
export const generateUuidV5 = (
    name: string,
    namespace: string = SIMMER_NAMESPACE,
): string => {
    // First, normalize the input to ensure consistent results
    const normalizedName = name.toLowerCase().trim();

    // Generate a UUID v5 using the uuid library
    return uuidv5(normalizedName, namespace);
};

/**
 * Checks if a string is a valid UUID format
 *
 * @param id The string to check
 * @returns True if the string is a valid UUID format
 */
export const isValidUuid = (id: string): boolean => {
    return uuidValidate(id);
};

/**
 * Ensures an ID is in UUID format.
 * If it's already a valid UUID, returns it as is.
 * If not, generates a deterministic UUID v5 from the ID.
 *
 * @param id The ID to convert to UUID format
 * @returns A valid UUID
 */
export const ensureUuid = (id: string): string => {
    if (isValidUuid(id)) {
        return id;
    }

    return generateUuidV5(id);
};
