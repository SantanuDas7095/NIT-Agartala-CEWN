
'use server';

/**
 * @fileOverview An AI flow for tracking meal nutrition from an image.
 *
 * - nutritionTracker - A function that handles the nutrition analysis.
 * - NutritionTrackerInput - The input type for the nutritionTracker function.
 * - NutritionTrackerOutput - The output type for the nutritionTracker function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NutritionTrackerInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type NutritionTrackerInput = z.infer<typeof NutritionTrackerInputSchema>;

const NutritionTrackerOutputSchema = z.object({
  calories: z.number().describe('Estimated total calories.'),
  proteinGrams: z.number().describe('Estimated grams of protein.'),
  carbsGrams: z.number().describe('Estimated grams of carbohydrates.'),
  fatGrams: z.number().describe('Estimated grams of fat.'),
});
export type NutritionTrackerOutput = z.infer<typeof NutritionTrackerOutputSchema>;

export async function nutritionTracker(input: NutritionTrackerInput): Promise<NutritionTrackerOutput> {
  return nutritionTrackerFlow(input);
}

const prompt = ai.definePrompt({
    name: 'nutritionTrackerPrompt',
    input: { schema: NutritionTrackerInputSchema },
    output: { schema: NutritionTrackerOutputSchema },
    prompt: `You are an expert nutritionist. Analyze the image of the meal provided and estimate its nutritional content.
    
    Identify the food items in the image and estimate the total calories, protein, carbohydrates, and fat in grams.
    
    Provide your response in the requested JSON format.
    
    Meal Photo: {{media url=photoDataUri}}`,
});

const nutritionTrackerFlow = ai.defineFlow(
  {
    name: 'nutritionTrackerFlow',
    inputSchema: NutritionTrackerInputSchema,
    outputSchema: NutritionTrackerOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
