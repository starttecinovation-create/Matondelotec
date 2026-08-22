'use server';
/**
 * @fileOverview A Genkit flow that acts as a print shop assistant.
 * It now supports receiving images from the user as part of the order.
 * 
 * - printOrderFlow - A function that converses with the user to take a print order.
 * - PrintOrderInput - The input type for the flow.
 * - PrintOrderOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageContentSchema = z.union([
    z.string(),
    z.object({
        type: z.literal('text'),
        text: z.string(),
    }),
    z.object({
        type: z.literal('media'),
        media: z.object({
            url: z.string().url(),
            contentType: z.string().optional(),
        })
    })
]);


const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(MessageContentSchema),
});

const PrintOrderInputSchema = z.object({
  serviceName: z.string().describe('The name of the print shop service.'),
  history: z.array(MessageSchema).describe('The chat history between the user and the model.'),
});
export type PrintOrderInput = z.infer<typeof PrintOrderInputSchema>;


const PrintOrderOutputSchema = z.object({
  response: z.string().describe('The next message from the assistant to the user.'),
});
export type PrintOrderOutput = z.infer<typeof PrintOrderOutputSchema>;

export async function printOrderFlow(input: PrintOrderInput): Promise<PrintOrderOutput> {
  const prompt = `You are a helpful and friendly AI assistant for a print shop called "${input.serviceName}". Your goal is to guide the user through placing a print order.

You need to collect the following information:
1. Product: What do they want to print? (e.g., business cards, flyers, posters, banners).
2. Quantity: How many units?
3. Paper/Material: What kind of paper or material? (e.g., glossy, matte, 250g, vinyl). If they don't know, offer common options.
4. Size: What are the dimensions? (e.g., A4, A5, standard business card size).
5. Artwork: Do they have the artwork ready to send, or do they need design services?

If the user sends an image, acknowledge that you received it (e.g., "Recebi a imagem, obrigado!"). The image is a reference for the product they want.

Be conversational. Ask one question at a time. Once you have all the information, summarize the order for the user and tell them the next step is to wait for a final quote from the print shop staff.

Start the conversation by greeting the user and asking what they would like to print today.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: prompt,
    history: input.history.map(msg => ({
      role: msg.role,
      content: msg.content.map(part => {
        if (typeof part === 'string') return { text: part };
        if (part.type === 'text') return { text: part.text };
        return { media: part.media };
      }),
    })) as any,
  });

  return { response: output.text ?? "Desculpe, não consegui processar o seu pedido. Pode tentar novamente?" };
}
