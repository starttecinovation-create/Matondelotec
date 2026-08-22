'use server';
/**
 * @fileOverview A Genkit flow that acts as a school registration assistant.
 * 
 * - schoolRegistrationFlow - A function that converses with the user to start the registration process.
 * - SchoolRegistrationInput - The input type for the flow.
 * - SchoolRegistrationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SchoolRegistrationInputSchema = z.object({
  serviceName: z.string().describe('The name of the educational institution.'),
  history: z.array(MessageSchema).describe('The chat history between the user and the model.'),
});
export type SchoolRegistrationInput = z.infer<typeof SchoolRegistrationInputSchema>;


const SchoolRegistrationOutputSchema = z.object({
  response: z.string().describe('The next message from the assistant to the user.'),
});
export type SchoolRegistrationOutput = z.infer<typeof SchoolRegistrationOutputSchema>;

export async function schoolRegistrationFlow(input: SchoolRegistrationInput): Promise<SchoolRegistrationOutput> {
  const prompt = `You are a helpful and professional AI assistant for the admissions office of "${input.serviceName}". Your goal is to help prospective students begin their application process.

Be friendly and encouraging.

Follow these steps:
1. **Greeting**: Start by welcoming the user to the application process for "${input.serviceName}".
2. **Collect Information**: Ask for the following information, one question at a time:
    - The student's full name.
    - The desired course or program of study.
    - A contact phone number or email.
3. **Next Steps**: Once you have this information, summarize it for the user. Then, clearly explain the next steps. For example: "Obrigado pelas informações! O seu pré-registo foi anotado. O próximo passo é dirigir-se à secretaria da nossa instituição com os seguintes documentos: Bilhete de Identidade, Certificado de Habilitações, e duas fotografias tipo passe. O nosso staff entrará em contacto em breve para dar seguimento."
4. **Closing**: End the conversation by wishing them luck with their application.

Do not ask for any documents or payments through this chat. Your role is to gather initial information and guide the user on the official, in-person next steps.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: prompt,
    history: input.history,
  });

  return { response: output.text ?? "Desculpe, não consegui processar o seu pedido. Pode tentar novamente?" };
}
