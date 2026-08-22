'use server';
/**
 * @fileOverview A Genkit flow for generating service names and descriptions.
 *
 * - generateServiceDescription - A function that creates a compelling service listing from a simple user prompt.
 * - ServiceDescriptionInput - The input type for the flow.
 * - ServiceDescriptionOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ServiceDescriptionInputSchema = z.object({
  userInput: z.string().describe('A simple description of the service provided by the user (e.g., "corte de cabelo e barba").'),
  category: z.string().describe('The business category for the service (e.g., "Barbearia").'),
});
export type ServiceDescriptionInput = z.infer<typeof ServiceDescriptionInputSchema>;

const ServiceDescriptionOutputSchema = z.object({
  serviceName: z.string().describe('The catchy, marketing-optimized name for the service.'),
  serviceDescription: z.string().describe('The detailed, appealing description for the service, written in paragraphs.'),
});
export type ServiceDescriptionOutput = z.infer<typeof ServiceDescriptionOutputSchema>;

export async function generateServiceDescription(input: ServiceDescriptionInput): Promise<ServiceDescriptionOutput> {
  return serviceDescriptionFlow(input);
}

const serviceDescriptionFlow = ai.defineFlow(
  {
    name: 'serviceDescriptionFlow',
    inputSchema: ServiceDescriptionInputSchema,
    outputSchema: ServiceDescriptionOutputSchema,
  },
  async ({ userInput, category }) => {
    const prompt = `You are a marketing expert specializing in creating compelling service listings for an online platform in Angola.
Your task is to take a user's simple input and the service category, and generate a catchy service name and a detailed, appealing service description in Portuguese.

Instructions:
1.  **Service Name**: Create a short, attractive, and descriptive name for the service.
2.  **Service Description**: Write a detailed description (2-3 paragraphs) that highlights the benefits and features of the service. Make it sound professional and trustworthy. Adapt the tone to the service category.

User Input: "${userInput}"
Category: "${category}"

Generate the service name and description.`;

    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      output: {
        schema: ServiceDescriptionOutputSchema,
      }
    });

    return output ?? { serviceName: '', serviceDescription: '' };
  }
);
