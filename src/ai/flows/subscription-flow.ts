
'use server';
/**
 * @fileOverview A Genkit flow for processing subscription payments.
 * It now automatically approves pending vendors upon successful payment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, writeBatch, serverTimestamp, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getSdks } from '@/firebase'; // Assuming getSdks gives firestore instance

const SubscriptionInputSchema = z.object({
  vendorId: z.string().describe("The UID of the vendor paying for the subscription."),
  amountPaid: z.number().describe("The amount paid for the subscription in AOA."),
});
export type SubscriptionInput = z.infer<typeof SubscriptionInputSchema>;

const SubscriptionOutputSchema = z.object({
  success: z.boolean(),
  subscriptionId: z.string().optional(),
  error: z.string().optional(),
});
export type SubscriptionOutput = z.infer<typeof SubscriptionOutputSchema>;

export async function processSubscriptionPayment(input: SubscriptionInput): Promise<SubscriptionOutput> {
  return subscriptionPaymentFlow(input);
}

const subscriptionPaymentFlow = ai.defineFlow(
  {
    name: 'subscriptionPaymentFlow',
    inputSchema: SubscriptionInputSchema,
    outputSchema: SubscriptionOutputSchema,
  },
  async ({ vendorId, amountPaid }) => {
    const { firestore } = getSdks();

    if (!firestore) {
      return { success: false, error: "Firestore is not initialized." };
    }

    const batch = writeBatch(firestore);

    try {
        const vendorRef = doc(firestore, 'users', vendorId);
        const vendorDoc = await getDoc(vendorRef);

        if (!vendorDoc.exists()) {
            return { success: false, error: 'Vendor profile not found.' };
        }

        const vendorData = vendorDoc.data();
        const currentBalance = vendorData.balance || 0;
        
        if (currentBalance < amountPaid) {
             return { success: false, error: 'Insufficient balance.' };
        }
        
        // 1. Debit the vendor's balance
        const newVendorBalance = currentBalance - amountPaid;
        batch.update(vendorRef, { balance: newVendorBalance });

        // 2. Create a transaction for the debit
        const vendorTransactionRef = doc(collection(firestore, `users/${vendorId}/transactions`));
        batch.set(vendorTransactionRef, {
            id: vendorTransactionRef.id,
            userId: vendorId,
            amount: amountPaid,
            type: 'debit',
            description: 'Pagamento da subscrição de parceiro',
            transactionDate: serverTimestamp(),
        });

        // 3. Create the subscription record
        const startDate = new Date();
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
        const subscriptionRef = doc(collection(firestore, `users/${vendorId}/subscriptions`));
        batch.set(subscriptionRef, {
            id: subscriptionRef.id,
            vendorId: vendorId,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            amountPaid: amountPaid,
            status: 'active',
        });
        
        // 4. *** AUTOMATIC APPROVAL ***
        // If the vendor is pending, approve them automatically upon first payment.
        if (vendorData.verificationStatus === 'pending') {
            batch.update(vendorRef, { verificationStatus: 'approved' });
        }


        // 5. Handle affiliate commission
        if (vendorData.referredBy) {
            const affiliateQuery = query(
                collection(firestore, 'users'),
                where('referralCode', '==', vendorData.referredBy)
            );
            const affiliateSnapshot = await getDocs(affiliateQuery);
            
            if (!affiliateSnapshot.empty) {
                const affiliateDoc = affiliateSnapshot.docs[0];
                const affiliateRef = affiliateDoc.ref;
                const affiliateData = affiliateDoc.data();

                const commission = amountPaid * 0.05; // 5% commission
                const newAffiliateBalance = (affiliateData.balance || 0) + commission;
                const newAffiliateEarnings = (affiliateData.referralEarnings || 0) + commission;
                
                // Update affiliate's balance and total earnings
                batch.update(affiliateRef, { 
                    balance: newAffiliateBalance,
                    referralEarnings: newAffiliateEarnings
                });

                // Create a transaction for the affiliate
                const affiliateTransactionRef = doc(collection(firestore, `users/${affiliateDoc.id}/transactions`));
                batch.set(affiliateTransactionRef, {
                    id: affiliateTransactionRef.id,
                    userId: affiliateDoc.id,
                    amount: commission,
                    type: 'credit',
                    description: `Comissão de afiliação de ${vendorData.displayName}`,
                    transactionDate: serverTimestamp(),
                });
            }
        }

        await batch.commit();

        return { success: true, subscriptionId: subscriptionRef.id };

    } catch (e: any) {
        console.error("Subscription payment failed:", e);
        return { success: false, error: e.message || "An unknown error occurred." };
    }
  }
);
