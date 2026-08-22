
'use server';
/**
 * @fileOverview A Genkit flow for a business assistant AI.
 * This assistant is designed to help administrators with verifying driver documents.
 * 
 * - businessAssistantFlow - Analyzes driver documents and provides a verification recommendation.
 * - BusinessAssistantInput - The input type for the flow.
 * - BusinessAssistantOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BusinessAssistantInputSchema = z.object({
  driverName: z.string().describe("The full name of the driver being verified."),
  identityCardUrl: z.string().describe("A data URI of the driver's identity card (BI). Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  drivingLicenseUrl: z.string().describe("A data URI of the driver's driving license. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  criminalRecordUrl: z.string().describe("A data URI of the driver's criminal record. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  vehicleRegistrationUrl: z.string().describe("A data URI of the vehicle's registration document (Livrete). Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  vehicleOwnershipUrl: z.string().describe("A data URI of the vehicle's ownership title. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  selfieVideoUrl: z.string().describe("A data URI of a selfie video of the driver. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  vehicleFrontVideoUrl: z.string().describe("A data URI of a video of the front of the vehicle. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  vehicleSidesVideoUrl: z.string().describe("A data URI of a video showing both sides of the vehicle. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type BusinessAssistantInput = z.infer<typeof BusinessAssistantInputSchema>;


const BusinessAssistantOutputSchema = z.object({
  identityCheck: z.object({
    isIdValid: z.boolean().describe("Whether the ID card appears to be a valid Angolan BI."),
    extractedIdName: z.string().describe("The full name extracted from the ID card."),
    idNumber: z.string().describe("The ID card number extracted."),
    idExpiryDate: z.string().describe("The expiry date of the ID card in YYYY-MM-DD format."),
    isFaceMatch: z.boolean().describe("Whether the face in the selfie video matches the face in the ID card photo."),
  }),
  licenseCheck: z.object({
    isLicenseValid: z.boolean().describe("Whether the driving license appears to be a valid, non-expired document."),
    licenseNumber: z.string().describe("The driving license number."),
    licenseExpiryDate: z.string().describe("The expiry date of the license in YYYY-MM-DD format."),
    vehicleCategories: z.string().describe("The vehicle categories the driver is licensed to operate (e.g., 'B, C1')."),
  }),
  criminalRecordCheck: z.object({
    isCriminalRecordClear: z.boolean().describe("Whether the criminal record is free of any serious offenses."),
    criminalRecordSummary: z.string().describe("A brief summary of the findings in the criminal record. State 'Registo limpo' if no offenses are found."),
  }),
  vehicleCheck: z.object({
    isVehicleDocValid: z.boolean().describe("Whether the vehicle documents (Livrete, Título) appear consistent and valid."),
    plateNumber: z.string().describe("The vehicle's license plate number extracted from the documents."),
    vehicleMake: z.string().describe("The make/brand of the vehicle (e.g., Toyota)."),
    vehicleModel: z.string().describe("The model of the vehicle (e.g., Corolla)."),
    vehicleCondition: z.string().describe("A brief summary of the vehicle's apparent physical condition based on the videos (e.g., 'Good condition, no visible damage')."),
  }),
  overallRecommendation: z.enum(['APPROVE', 'REJECT', 'REVIEW']).describe("The final recommendation: APPROVE if all checks pass, REJECT if there are critical issues, or REVIEW for manual checking."),
  recommendationReason: z.string().describe("A clear and concise reason for the overall recommendation."),
});
export type BusinessAssistantOutput = z.infer<typeof BusinessAssistantOutputSchema>;

export async function businessAssistantFlow(input: BusinessAssistantInput): Promise<BusinessAssistantOutput> {
    
  const prompt = `You are a meticulous verification agent for a transport company in Angola called Matondelo. Your task is to analyze documents and videos for a new driver applicant and provide a structured verification report.

  The applicant's name is: **${input.driverName}**.

  You will be given several documents and videos:
  1.  Bilhete de Identidade (BI) - Angolan National ID Card
  2.  Carta de Condução - Driving License
  3.  Registo Criminal - Criminal Record
  4.  Livrete - Vehicle Registration
  5.  Título de Propriedade - Vehicle Ownership Title
  6.  Vídeo Selfie - A short video of the driver's face.
  7.  Vídeos da Viatura - Videos of the vehicle's front and sides.

  **Your Analysis Steps:**

  1.  **Identity Check:**
      - Analyze the Bilhete de Identidade (BI). Verify that it's a legitimate Angolan BI.
      - Extract the full name, BI number, and expiry date. Check if it's expired.
      - Compare the face in the Selfie Vídeo with the photo on the BI. Set \`isFaceMatch\` accordingly.
      - Set \`isIdValid\` to true only if it's a valid, non-expired Angolan BI and the name on the ID roughly matches the applicant's name.

  2.  **License Check:**
      - Analyze the Carta de Condução.
      - Extract the license number, expiry date, and vehicle categories.
      - Set \`isLicenseValid\` to true if it is not expired.

  3.  **Criminal Record Check:**
      - Carefully read the Registo Criminal for any listed offenses, especially those related to violence, theft, fraud, or serious driving violations.
      - Set \`isCriminalRecordClear\` to true if there are no serious offenses.
      - Summarize your findings in \`criminalRecordSummary\`.

  4.  **Vehicle Check:**
      - Analyze the Livrete and Título de Propriedade. Check for consistency (e.g., same plate number).
      - Extract the license plate number, vehicle make, and model.
      - Analyze the videos of the vehicle.
      - Assess the vehicle's condition. Look for significant damage, dents, or broken parts.
      - Summarize the condition in the \`vehicleCondition\` field.
      - Set \`isVehicleDocValid\` to true if documents seem consistent.

  5.  **Overall Recommendation:**
      - **APPROVE**: If all documents are valid, not expired, the face matches, the criminal record is clear, and the vehicle is in good condition.
      - **REJECT**: If any document is clearly fake/expired, the face does not match, or there are serious criminal offenses or major vehicle damage.
      - **REVIEW**: If videos are blurry, information is contradictory, or you have any doubts that require a human to double-check.

  6.  **Provide a Clear Reason:** Briefly justify your recommendation in the \`recommendationReason\` field.

  **Documents for Analysis:**
  - Bilhete de Identidade: {{media url=identityCardUrl}}
  - Carta de Condução: {{media url=drivingLicenseUrl}}
  - Registo Criminal: {{media url=criminalRecordUrl}}
  - Livrete: {{media url=vehicleRegistrationUrl}}
  - Título de Propriedade: {{media url=vehicleOwnershipUrl}}
  - Vídeo Selfie: {{media url=selfieVideoUrl}}
  - Vídeo Viatura (Frente): {{media url=vehicleFrontVideoUrl}}
  - Vídeo Viatura (Laterais): {{media url=vehicleSidesVideoUrl}}

  Provide your complete analysis in the required JSON format.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: {
      schema: BusinessAssistantOutputSchema,
    },
  });

  return output ?? {
    identityCheck: {
      isIdValid: false,
      extractedIdName: 'Error',
      idNumber: 'Error',
      idExpiryDate: 'Error',
      isFaceMatch: false,
    },
    licenseCheck: {
        isLicenseValid: false,
        licenseNumber: 'Error',
        licenseExpiryDate: 'Error',
        vehicleCategories: 'Error',
    },
    criminalRecordCheck: {
        isCriminalRecordClear: false,
        criminalRecordSummary: 'Failed to analyze documents.',
    },
    vehicleCheck: {
        isVehicleDocValid: false,
        plateNumber: 'Error',
        vehicleMake: 'Error',
        vehicleModel: 'Error',
        vehicleCondition: 'Failed to analyze videos.',
    },
    overallRecommendation: 'REVIEW',
    recommendationReason: 'An unexpected error occurred during AI analysis. Manual review is required.',
  };
}
