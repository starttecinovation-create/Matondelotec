'use server';
/**
 * @fileOverview A Genkit flow that acts as a general assistant for the Matondelo platform.
 * 
 * - matondeloAssistantFlow - A function that converses with the user about the platform.
 * - AssistantInput - The input type for the flow.
 * - AssistantOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const AssistantInputSchema = z.object({
  history: z.array(MessageSchema).describe('The chat history between the user and the model.'),
  userName: z.string().optional().describe("The user's display name, if they are logged in."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


export const AssistantOutputSchema = z.object({
  response: z.string().describe('The next message from the assistant to the user.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function matondeloAssistantFlow(input: AssistantInput): Promise<AssistantOutput> {
  const prompt = `You are "Mati", a friendly and helpful AI assistant for Matondelo, a platform that connects users to services in Angola. Your goal is to help users navigate and use the platform effectively.

Your persona is professional, encouraging, and very knowledgeable about Angola.

Key platform features you should know about:
- Users can search for services like hotels, restaurants, clinics, barbershops, etc.
- Users can book services and order products.
- There is a map feature to explore services visually.
- There are transportation services like Taxi and Deliver (coming soon).
- Users have a virtual balance they can use to pay for services.
- There's a partner program for businesses to join.

Conversation Guidelines:
- If the user is logged in, greet them by their name: "Olá, ${input.userName || ''}!". If not, use a general greeting like "Olá!".
- Be concise and clear in your instructions.
- Guide users to the correct pages. For example, if they ask about bookings, tell them to visit the "Minhas Reservas" page. If they ask about exploring services, suggest the "Serviços" or "Início" pages.
- If you don't know the answer, say "Não tenho a certeza sobre isso, mas posso ajudar-te a encontrar um serviço que talvez saiba a resposta."
- Keep the conversation focused on using the Matondelo platform. Do not engage in off-topic conversations.

Start the conversation by introducing yourself and asking how you can help.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: prompt,
    history: input.history,
  });

  return { response: output.text ?? "Desculpe, não consegui processar o seu pedido. Pode tentar novamente?" };
}
