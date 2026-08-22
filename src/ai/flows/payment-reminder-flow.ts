'use server';
/**
 * @fileOverview A Genkit flow for sending payment reminders for subscriptions.
 *
 * - subscriptionReminderFlow - Checks for expiring subscriptions and sends reminders.
 * - ReminderOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collectionGroup, query, where, getDocs, writeBatch, Timestamp, doc } from 'firebase/firestore';
import { getSdks } from '@/firebase';

const ReminderOutputSchema = z.object({
  success: z.boolean(),
  remindersSent: z.number(),
  error: z.string().optional(),
});
export type ReminderOutput = z.infer<typeof ReminderOutputSchema>;

export async function subscriptionReminderFlow(): Promise<ReminderOutput> {
  return sendSubscriptionReminders();
}

const sendSubscriptionReminders = ai.defineFlow(
  {
    name: 'subscriptionReminderFlow',
    outputSchema: ReminderOutputSchema,
  },
  async () => {
    const { firestore } = getSdks();
    if (!firestore) {
      return { success: false, remindersSent: 0, error: "Firestore is not initialized." };
    }

    const batch = writeBatch(firestore);
    let remindersSentCount = 0;

    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
      
      const q = query(
        collectionGroup(firestore, 'subscriptions'),
        where('status', '==', 'active'),
        where('endDate', '<=', Timestamp.fromDate(sevenDaysFromNow))
      );

      const querySnapshot = await getDocs(q);

      for (const subDoc of querySnapshot.docs) {
        const subscription = subDoc.data();
        const vendorId = subscription.vendorId;

        // Check if a reminder was already sent recently
        if (subscription.lastReminderSent) {
            const lastSentDate = subscription.lastReminderSent.toDate();
            // If reminder was sent in the last 7 days, skip
            if ((today.getTime() - lastSentDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
                continue;
            }
        }

        const notificationRef = doc(collection(firestore, `users/${vendorId}/notifications`));
        const endDate = subscription.endDate.toDate();
        const formattedEndDate = endDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

        const message = `A sua subscrição de parceiro expira em breve, no dia ${formattedEndDate}. Renove para manter os seus serviços ativos.`;

        batch.set(notificationRef, {
            id: notificationRef.id,
            userId: vendorId,
            message: message,
            status: 'unread',
            createdAt: Timestamp.now(),
        });
        
        // Mark that a reminder has been sent
        batch.update(subDoc.ref, { lastReminderSent: Timestamp.now() });

        remindersSentCount++;
      }
      
      if (remindersSentCount > 0) {
        await batch.commit();
      }

      return { success: true, remindersSent: remindersSentCount };

    } catch (e: any) {
      console.error("Subscription reminder flow failed:", e);
      return { success: false, remindersSent: 0, error: e.message || "An unknown error occurred." };
    }
  }
);
