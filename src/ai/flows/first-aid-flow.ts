
'use server';

/**
 * @fileOverview A first-aid chatbot flow.
 *
 * - firstAidChat - A function that handles the chat interaction.
 * - FirstAidChatInput - The input type for the chat function.
 * - FirstAidChatOutput - The output type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FirstAidMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type FirstAidMessage = z.infer<typeof FirstAidMessageSchema>;

const FirstAidChatInputSchema = z.object({
  history: z.array(FirstAidMessageSchema).describe('The chat history so far.'),
});
export type FirstAidChatInput = z.infer<typeof FirstAidChatInputSchema>;

const FirstAidChatOutputSchema = z.object({
    response: z.string().describe("The AI's response to the user's query."),
});
export type FirstAidChatOutput = z.infer<typeof FirstAidChatOutputSchema>;

export async function firstAidChat(input: FirstAidChatInput): Promise<FirstAidChatOutput> {
  return firstAidFlow(input);
}

const firstAidFlow = ai.defineFlow(
  {
    name: 'firstAidFlow',
    inputSchema: FirstAidChatInputSchema,
    outputSchema: FirstAidChatOutputSchema,
  },
  async ({ history }) => {
    const lastUserMessage = history.findLast(m => m.role === 'user');
    if (!lastUserMessage) {
        throw new Error("No user message found in history.");
    }
    
    const prompt = `You are a helpful first-aid assistant bot. Your role is to provide clear, concise, and safe first-aid advice for minor health emergencies.
    
    IMPORTANT: You must always include a disclaimer that your advice is not a substitute for professional medical help and that a doctor should be consulted for serious issues.
    
    Analyze the user's query and provide step-by-step first-aid instructions if appropriate. If the situation sounds serious, strongly advise them to seek immediate medical attention.

    User's query: "${lastUserMessage.content}"
    
    Previous conversation:
    ${history.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')}
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
    });

    return { response: llmResponse.text };
  }
);
