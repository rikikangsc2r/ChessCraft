'use server';
/**
 * @fileOverview Generates a suggested username using a generative AI model.
 *
 * - generateSuggestedUsername - A function that generates a suggested username.
 * - GenerateSuggestedUsernameInput - The input type for the generateSuggestedUsername function (currently empty).
 * - GenerateSuggestedUsernameOutput - The return type for the generateSuggestedUsername function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSuggestedUsernameInputSchema = z.object({});
export type GenerateSuggestedUsernameInput = z.infer<
  typeof GenerateSuggestedUsernameInputSchema
>;

const GenerateSuggestedUsernameOutputSchema = z.object({
  username: z.string().describe('A suggested username for the user.'),
});
export type GenerateSuggestedUsernameOutput = z.infer<
  typeof GenerateSuggestedUsernameOutputSchema
>;

export async function generateSuggestedUsername(
  input: GenerateSuggestedUsernameInput
): Promise<GenerateSuggestedUsernameOutput> {
  return generateSuggestedUsernameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSuggestedUsernamePrompt',
  input: {schema: GenerateSuggestedUsernameInputSchema},
  output: {schema: GenerateSuggestedUsernameOutputSchema},
  prompt: `You are a username generator. Generate a username that is cool and unique. The username should be short, between 5 and 10 characters.`,
});

const generateSuggestedUsernameFlow = ai.defineFlow(
  {
    name: 'generateSuggestedUsernameFlow',
    inputSchema: GenerateSuggestedUsernameInputSchema,
    outputSchema: GenerateSuggestedUsernameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
