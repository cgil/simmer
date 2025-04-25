import { createContext, FC, ReactNode, useContext, useState } from 'react';
import { SubstituteOption, SubstitutionState } from '../../types/substitution';

interface Ingredient {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
}

interface IngredientSubstitutionContextType {
    substitutions: Record<string, SubstitutionState>;
    addSubstitution: (
        ingredientId: string,
        originalIngredient: Ingredient,
        substituteOption: SubstituteOption
    ) => void;
    removeSubstitution: (ingredientId: string) => void;
    getSubstitutedIngredient: (ingredientId: string) => Ingredient | null;
    hasSubstitution: (ingredientId: string) => boolean;
    getSubstituteInfo: (ingredientId: string) => SubstituteOption | null;
    getOriginalIngredient: (ingredientId: string) => Ingredient | null;
}

// Create context with default values
export const IngredientSubstitutionContext =
    createContext<IngredientSubstitutionContextType>({
        substitutions: {},
        addSubstitution: () => {},
        removeSubstitution: () => {},
        getSubstitutedIngredient: () => null,
        hasSubstitution: () => false,
        getSubstituteInfo: () => null,
        getOriginalIngredient: () => null,
    });

// Create provider component
interface IngredientSubstitutionProviderProps {
    children: ReactNode;
}

export const IngredientSubstitutionProvider: FC<
    IngredientSubstitutionProviderProps
> = ({ children }) => {
    const [substitutions, setSubstitutions] = useState<
        Record<string, SubstitutionState>
    >({});

    // Add a new substitution
    const addSubstitution = (
        ingredientId: string,
        originalIngredient: Ingredient,
        substituteOption: SubstituteOption
    ) => {
        setSubstitutions((prev) => ({
            ...prev,
            [ingredientId]: {
                originalIngredientId: ingredientId,
                originalIngredient,
                substituteOption, // Store the full substitute option
            },
        }));
    };

    // Remove a substitution
    const removeSubstitution = (ingredientId: string) => {
        setSubstitutions((prev) => {
            const newSubstitutions = { ...prev };
            delete newSubstitutions[ingredientId];
            return newSubstitutions;
        });
    };

    // Check if an ingredient has been substituted
    const hasSubstitution = (ingredientId: string) => {
        return Object.prototype.hasOwnProperty.call(
            substitutions,
            ingredientId
        );
    };

    // Get the substituted ingredient data
    const getSubstitutedIngredient = (
        ingredientId: string
    ): Ingredient | null => {
        if (!hasSubstitution(ingredientId)) return null;

        const substitution = substitutions[ingredientId];
        const substituteOption = substitution.substituteOption;

        if (substituteOption.ingredients.length === 1) {
            const ingredient = substituteOption.ingredients[0];
            return {
                id: `subst-${ingredientId}`,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
            };
        }

        // For multi-ingredient substitutes, we'll just return a placeholder
        return {
            id: `subst-${ingredientId}`,
            name: 'Multiple ingredients',
            quantity: null,
            unit: null,
        };
    };

    // Get the original ingredient data
    const getOriginalIngredient = (ingredientId: string): Ingredient | null => {
        if (!hasSubstitution(ingredientId)) return null;
        return substitutions[ingredientId].originalIngredient;
    };

    // Get the substitute info
    const getSubstituteInfo = (
        ingredientId: string
    ): SubstituteOption | null => {
        if (!hasSubstitution(ingredientId)) return null;
        return substitutions[ingredientId].substituteOption;
    };

    return (
        <IngredientSubstitutionContext.Provider
            value={{
                substitutions,
                addSubstitution,
                removeSubstitution,
                getSubstitutedIngredient,
                hasSubstitution,
                getSubstituteInfo,
                getOriginalIngredient,
            }}
        >
            {children}
        </IngredientSubstitutionContext.Provider>
    );
};

// Create a hook for easy context consumption
export const useIngredientSubstitution = () =>
    useContext(IngredientSubstitutionContext);
