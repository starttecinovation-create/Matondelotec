'use server';
/**
 * @fileOverview A Genkit flow for securely fetching a photo of a place from the Google Places API.
 * 
 * - getPlacePhoto - A function that handles the photo fetching process.
 * - PlacePhotoInput - The input type for the flow.
 * - PlacePhotoOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Client } from "@googlemaps/google-maps-services-js";

// Define input schema using Zod
const PlacePhotoInputSchema = z.object({
  textQuery: z.string().describe('The text query to search for a place (e.g., "Hotel Baía Luanda").'),
});
export type PlacePhotoInput = z.infer<typeof PlacePhotoInputSchema>;

// Define output schema
const PlacePhotoOutputSchema = z.object({
  photoUrl: z.string().nullable().describe('The URL of the place photo.'),
  attribution: z.string().nullable().describe('The HTML attribution for the photo.'),
});
export type PlacePhotoOutput = z.infer<typeof PlacePhotoOutputSchema>;

// The exported wrapper function that clients will call.
export async function getPlacePhoto(input: PlacePhotoInput): Promise<PlacePhotoOutput> {
  return placePhotoFlow(input);
}

// The Genkit Flow definition.
const placePhotoFlow = ai.defineFlow(
  {
    name: 'placePhotoFlow',
    inputSchema: PlacePhotoInputSchema,
    outputSchema: PlacePhotoOutputSchema,
  },
  async ({ textQuery }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is not configured.");
      return { photoUrl: null, attribution: null };
    }

    const client = new Client({});

    try {
      // 1. Find the place ID from the text query
      const findPlaceResponse = await client.findPlaceFromText({
        params: {
          input: textQuery,
          inputtype: 'textquery',
          fields: ['place_id', 'photos'],
          key: apiKey,
        },
      });
      
      const candidate = findPlaceResponse.data.candidates[0];
      if (!candidate || !candidate.photos) {
        return { photoUrl: null, attribution: null };
      }

      // 2. Get the photo reference and attribution
      const photo = candidate.photos[0];
      const photoReference = photo.photo_reference;
      const attribution = photo.html_attributions[0];
      
      // 3. Construct the photo URL
      // The Places API photo URL is constructed manually, not through a separate SDK call
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${apiKey}`;

      return { photoUrl, attribution };

    } catch (e: any) {
      console.error("Error in placePhotoFlow:", e.response?.data?.error_message || e.message);
      return { photoUrl: null, attribution: null };
    }
  }
);
