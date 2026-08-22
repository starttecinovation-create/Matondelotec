'use server';
/**
 * @fileOverview A Genkit flow for securely calling the Google Area Insights API.
 * 
 * - getAreaInsights - A function that handles the area insights query.
 * - AreaInsightsInput - The input type for the flow.
 * - AreaInsightsOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { computeAreaInsights, type InsightRequestFilter } from '@/services/google-maps-service';

// Using zod to define a flexible schema that matches the InsightRequestFilter
const AreaInsightsInputSchema = z.object({
  locationFilter: z.object({
    region: z.object({
      place: z.string().describe('The Place ID of the region to analyze.'),
    }),
  }),
  typeFilter: z.object({
    includedTypes: z.array(z.string()).optional(),
  }).optional(),
  operatingStatus: z.array(z.string()).optional(),
  priceLevels: z.array(z.string()).optional(),
  ratingFilter: z.object({
    minRating: z.number().optional(),
    maxRating: z.number().optional(),
  }).optional(),
});
export type AreaInsightsInput = z.infer<typeof AreaInsightsInputSchema>;


const AreaInsightsOutputSchema = z.object({
    insightCount: z.object({
        count: z.number(),
        countDetails: z.any().optional(),
    }).optional(),
    error: z.string().optional(),
});
export type AreaInsightsOutput = z.infer<typeof AreaInsightsOutputSchema>;

// The exported wrapper function that clients will call.
export async function getAreaInsights(input: AreaInsightsInput): Promise<AreaInsightsOutput> {
  return computeAreaInsightsFlow(input);
}


// The Genkit Flow definition.
const computeAreaInsightsFlow = ai.defineFlow(
  {
    name: 'computeAreaInsightsFlow',
    inputSchema: AreaInsightsInputSchema,
    outputSchema: AreaInsightsOutputSchema,
  },
  async (filter) => {
    try {
      // The filter from the input is already in the correct format.
      const result: any = await computeAreaInsights(filter as InsightRequestFilter);
      return { insightCount: result.insightCount };
    } catch (e: any) {
      console.error("Error in computeAreaInsightsFlow:", e);
      return { error: e.message || 'An unexpected error occurred.' };
    }
  }
);
