/**
 * @fileOverview A service for interacting with Google Maps APIs, such as Area Insights.
 */

const AREA_INSIGHTS_URL = 'https://areainsights.googleapis.com/v1:computeInsights';

export type InsightRequestFilter = {
    locationFilter: {
        region: {
            place: string; // e.g. "places/ChIJIQBpAG2ahYAR_6128GcTUEo"
        };
    };
    typeFilter?: {
        includedTypes?: string[];
    };
    operatingStatus?: string[];
    priceLevels?: string[];
    ratingFilter?: {
        minRating?: number;
        maxRating?: number;
    };
};

/**
 * Computes insights for a given area using the Google Area Insights API.
 * Usa fetch nativo para compatibilidade total com Next.js 15 e Node 20+.
 */
export async function computeAreaInsights(filter: InsightRequestFilter) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("Google Maps API key is not configured.");
    }

    const body = {
        insights: ["INSIGHT_COUNT"],
        filter: filter,
    };
    
    const response = await fetch(AREA_INSIGHTS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Area Insights API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`Failed to fetch area insights. Status: ${response.status}`);
    }

    return await response.json();
}
