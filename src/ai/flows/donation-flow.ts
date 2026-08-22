'use server';
/**
 * @fileOverview A Genkit flow for securely processing donations from a user's virtual balance.
 *
 * - processDonation - A function that handles the donation transaction.
 * - DonationInput - The input type for the flow.
 * - DonationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, writeBatch, serverTimestamp, collection, increment } from 'firebase/firestore';
import { getSdks } from '@/firebase';

const DonationInputSchema = z.object({
  userId: z.string().describe("The UID of the user making the donation."),
  projectId: z.string().describe("The ID of the charity project receiving the donation."),
  amount: z.number().positive("The amount to donate, must be a positive number."),
});
export type DonationInput = z.infer<typeof DonationInputSchema>;

const DonationOutputSchema = z.object({
  success: z.boolean(),
  transactionId: z.string().optional(),
  error: z.string().optional(),
});
export type DonationOutput = z.infer<typeof DonationOutputSchema>;

export async function processDonation(input: DonationInput): Promise<DonationOutput> {
  return donationFlow(input);
}

const donationFlow = ai.defineFlow(
  {
    name: 'donationFlow',
    inputSchema: DonationInputSchema,
    outputSchema: DonationOutputSchema,
  },
  async ({ userId, projectId, amount }) => {
    const { firestore } = getSdks();

    if (!firestore) {
      return { success: false, error: "Firestore is not initialized." };
    }
    
    const batch = writeBatch(firestore);

    try {
        const userRef = doc(firestore, 'users', userId);
        const projectRef = doc(firestore, 'charity_projects', projectId);

        const [userDoc, projectDoc] = await Promise.all([getDoc(userRef), getDoc(projectRef)]);

        if (!userDoc.exists()) {
            return { success: false, error: 'User profile not found.' };
        }
        if (!projectDoc.exists()) {
            return { success: false, error: 'Charity project not found.' };
        }

        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;
        
        if (currentBalance < amount) {
             return { success: false, error: 'Insufficient balance.' };
        }
        
        // 1. Debit the user's balance
        const newBalance = currentBalance - amount;
        batch.update(userRef, { balance: newBalance });

        // 2. Create a transaction record for the user
        const transactionRef = doc(collection(firestore, `users/${userId}/transactions`));
        batch.set(transactionRef, {
            id: transactionRef.id,
            userId: userId,
            amount: amount,
            type: 'debit',
            description: `Doação para o projeto: ${projectDoc.data().title}`,
            transactionDate: serverTimestamp(),
        });

        // 3. Increment the project's raised amount
        batch.update(projectRef, { raised: increment(amount) });
        
        await batch.commit();

        return { success: true, transactionId: transactionRef.id };

    } catch (e: any) {
        console.error("Donation processing failed:", e);
        return { success: false, error: e.message || "An unknown error occurred." };
    }
  }
);
