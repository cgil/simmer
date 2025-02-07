import { supabase } from './supabase';
import { Recipe } from '../types';

export const extractRecipe = async (url: string): Promise<Recipe> => {
    const { data, error } = await supabase.functions.invoke('recipe-extraction', {
        body: { url },
    });

    if (error) {
        throw new Error(`Recipe extraction failed: ${error.message}`);
    }

    return data;
};
