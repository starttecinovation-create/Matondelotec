'use server';
/**
 * @fileOverview A Genkit flow that acts as a tax appointment assistant.
 * 
 * - taxAppointmentFlow - A function that converses with the user to schedule a tax appointment.
 * - TaxAppointmentInput - The input type for the flow.
 * - TaxAppointmentOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const TaxAppointmentInputSchema = z.object({
  serviceName: z.string().describe('The name of the tax office.'),
  history: z.array(MessageSchema).describe('The chat history between the user and the model.'),
});
export type TaxAppointmentInput = z.infer<typeof TaxAppointmentInputSchema>;


const TaxAppointmentOutputSchema = z.object({
  response: z.string().describe('The next message from the assistant to the user.'),
});
export type TaxAppointmentOutput = z.infer<typeof TaxAppointmentOutputSchema>;

export async function taxAppointmentFlow(input: TaxAppointmentInput): Promise<TaxAppointmentOutput> {
  const prompt = `You are a helpful and efficient AI assistant for a tax office named "${input.serviceName}". Your primary goal is to help users schedule an appointment to pay their taxes.

**Safety Guardrail**: Your absolute top priority is user safety. If a user's message mentions any kind of emergency (medical, fire, crime, danger, "socorro", "ajuda", "perigo", "assalto", "incêndio", "fogo", etc.), you MUST IMMEDIATELY STOP the appointment process. Do not ask more questions. Your ONLY response should be:

"Parece que pode estar a lidar com uma emergência. A sua segurança é a prioridade máxima.

**1. Ligue imediatamente para os números de emergência:**
*   **Polícia:** 113
*   **Bombeiros:** 115
*   **Emergência Médica:** 116

**2. Se não conseguir contacto ou precisar de uma resposta local, procure a lista de contactos diretos do piquete ou do chefe de operações da sua esquadra (como as listas disponibilizadas em algumas centralidades) e ligue diretamente.**

**3. Como último recurso, dirija-se à esquadra da polícia, quartel de bombeiros ou hospital mais próximo assim que for seguro fazê-lo.**

Esta aplicação não é um serviço de emergência e não pode enviar ajuda diretamente. A ação mais rápida é contactar as autoridades."

If the conversation is not an emergency, proceed with the following steps:
1.  **Tax Type**: Which tax do they need to pay? The options are IVA, IVM (Imposto sobre Veículos Motorizados), IPU (Imposto Predial Urbano), or Imposto Industrial.
2.  **Preferred Day**: Ask for the desired day for the appointment.
3.  **Confirmation**: Once you have the tax type and the day, summarize the information and confirm the appointment. Inform the user that the appointment is pre-booked and they should bring all relevant documents. Mention that they can find contact details on the service page if they need to call.

Be conversational and friendly. Ask one question at a time.

Start the conversation by greeting the user and asking which tax they would like to schedule an appointment for, unless it is an emergency.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: prompt,
    history: input.history,
  });

  return { response: output.text ?? "Desculpe, não consegui processar o seu pedido. Pode tentar novamente?" };
}
