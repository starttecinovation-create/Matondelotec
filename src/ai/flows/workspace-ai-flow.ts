'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const WorkspaceAIInputSchema = z.object({
  type: z.enum([
    'email_campaign', 
    'document_generation', 
    'apps_script_automation',
    'slides_generation',
    'classroom_curriculum',
    'forms_structure',
    'ads_optimization',
    'keep_notes',
    'meet_agenda',
    'notebook_lm'
  ]),
  prompt: z.string(),
  context: z.string().optional(),
});
export type WorkspaceAIInput = z.infer<typeof WorkspaceAIInputSchema>;

export const WorkspaceAIOutputSchema = z.object({
  content: z.string().describe('The primary generated text content (email body, document markdown, code, or structured JSON).'),
  subject: z.string().optional().describe('For emails/docs/campaigns, a captivating title or subject line.'),
  instructions: z.string().optional().describe('Step-by-step instructions (especially for Apps Script installation or workspace setup).'),
});
export type WorkspaceAIOutput = z.infer<typeof WorkspaceAIOutputSchema>;

export async function executeWorkspaceAI(input: WorkspaceAIInput): Promise<WorkspaceAIOutput> {
  let promptText = '';

  if (input.type === 'email_campaign') {
    promptText = `You are an expert marketing copywriter. Generate a highly persuasive, engaging, and professional email campaign.
    
Goal/Topic: ${input.prompt}
Context of the partner business: ${input.context || 'A business in Angola'}

Please output your response as JSON matching this structure:
{
  "subject": "A catchy, urgent, and professional subject line",
  "content": "The beautiful, formatted email body. Use friendly professional tone, clear CTA, and structure."
}`;
  } else if (input.type === 'document_generation') {
    promptText = `You are a professional business consultant and lawyer. Generate a comprehensive document (e.g., a formal contract, a business proposal, a detailed report, or an invoice structure).
    
Topic / Requirements: ${input.prompt}
Business Context: ${input.context || 'A business in Angola'}

Please write a highly detailed, professional document in elegant Portuguese. Format it in clean markdown.
Output your response as JSON matching this structure:
{
  "subject": "Document Title",
  "content": "The complete markdown formatted document text."
}`;
  } else if (input.type === 'apps_script_automation') {
    promptText = `You are an expert Google Apps Script developer and automation architect. Generate a reliable Google Apps Script code to automate tasks within Google Sheets, Docs, Forms, Gmail, or Google Calendar.
    
Automation Request: ${input.prompt}
Business Context: ${input.context || 'Matondelo platform partner'}

Ensure your Apps Script is clean, has proper error handling, uses correct Google APIs, and is easy to copy-paste.
Provide clear step-by-step instructions on how the user should install and trigger it in their Google account (e.g. setting up a trigger, adding it to a sheet).

Please output your response as JSON matching this structure:
{
  "subject": "Automation Title",
  "content": "The actual javascript Apps Script code block",
  "instructions": "Clear step-by-step instructions in Portuguese explaining how to paste this in extensions -> Apps Script, configure triggers, and authorize permissions."
}`;
  } else if (input.type === 'slides_generation') {
    promptText = `You are a professional business presenter. Create a complete, highly structured outline and content for a Google Slides presentation.
    
Presentation Topic: ${input.prompt}
Business Context: ${input.context || 'Matondelo partner'}

Structure the presentation with 5 distinct slides: Title slide, Problem, Solution, Business Model/Offer, Call to Action.
For each slide, specify: Slide Title, Bullet Points, and Visual Suggestions.

Please output your response as JSON matching this structure:
{
  "subject": "Presentation Deck Title",
  "content": "Slide 1: [Title]\\n- Bullet 1\\n- Bullet 2\\n\\nSlide 2: [Title]\\n- Bullet 1...\\n\\n"
}`;
  } else if (input.type === 'classroom_curriculum') {
    promptText = `You are a professional teacher and corporate training designer. Design a lesson plan, syllabus, or training questions for Google Classroom.
    
Course / Training Topic: ${input.prompt}
Context: ${input.context || 'Matondelo partner corporate environment'}

Write a complete, structured syllabus including lesson outlines, goals, and 3 review quiz questions.

Please output your response as JSON matching this structure:
{
  "subject": "Classroom Curriculum Title",
  "content": "Course syllabus, lessons, and exam questions formatted in clean markdown."
}`;
  } else if (input.type === 'forms_structure') {
    promptText = `You are a professional customer feedback and survey designer. Design a clean Google Forms structure with questions, options, and response fields.
    
Form Purpose / Topic: ${input.prompt}
Context: ${input.context || 'Matondelo partner business'}

Design 4-5 key questions (e.g. satisfaction scale, multi-choice, paragraph) to collect feedback.

Please output your response as JSON matching this structure:
{
  "subject": "Google Form Title",
  "content": "List of questions, question types, and multiple choice options formatted in clean text/markdown."
}`;
  } else if (input.type === 'ads_optimization') {
    promptText = `You are an expert Google Ads consultant and digital marketer. Design an optimal Google Ads campaign outline.
    
Campaign Goal / Audience: ${input.prompt}
Business Context: ${input.context || 'A local business in Luanda, Angola'}

Provide:
1. Target Audience & Locations (Luanda, Talatona, etc)
2. Recommended Daily Budget in AOA
3. 3 High-converting search ad headlines and descriptions
4. 10 Targeted keywords with search intents

Please output your response as JSON matching this structure:
{
  "subject": "Google Ads Campaign Strategy",
  "content": "Campaign copy, headlines, descriptions, keywords, and budget recommendations formatted in clean markdown."
}`;
  } else if (input.type === 'keep_notes') {
    promptText = `You are a smart organizer. Take a rough brain-dump or instruction and structure it into a perfect, elegant Google Keep note with tasks, subtasks, and checklists.
    
Note / Instructions: ${input.prompt}
Context: ${input.context || 'Matondelo productivity'}

Please output your response as JSON matching this structure:
{
  "subject": "Keep Note Title",
  "content": "A beautifully organized note with checkbox items [ ] or structured paragraphs."
}`;
  } else if (input.type === 'meet_agenda') {
    promptText = `You are a professional meeting facilitator. Design a detailed agenda and conference notes for an upcoming Google Meet call.
    
Meeting Topic: ${input.prompt}
Context: ${input.context || 'Business alignment meeting'}

Design an agenda with timing, objective, preparation requirements, and pre-written introductory remarks.

Please output your response as JSON matching this structure:
{
  "subject": "Google Meet Call Agenda",
  "content": "Detailed timeline, discussion subjects, and prepared materials in clean markdown."
}`;
  } else if (input.type === 'notebook_lm') {
    promptText = `You are the ultimate NotebookLM AI research assistant. Synthesize, analyze, and present an exhaustive briefing document based on the user's business documents and general instructions.
    
Study Topic / Document Reference: ${input.prompt}
Business Context: ${input.context || 'Matondelo workspace partner'}

Generate two distinct outputs combined in markdown formatting:
1. **The Audio Briefing (Podcast Script)**: A dynamic, highly engaging conversational script between two hosts (Host A and Host B) who break down the user's topic in easy-to-understand analogies.
2. **The Executive Study Guide**: A deep-dive analysis, listing key insights, action items, and strategic considerations.

Please output your response as JSON matching this structure:
{
  "subject": "NotebookLM Deep Briefing",
  "content": "The beautifully formatted podcast transcript and deep-dive study guide in markdown."
}`;
  }

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (output.text) {
      const parsed = JSON.parse(output.text);
      return {
        content: parsed.content || '',
        subject: parsed.subject || '',
        instructions: parsed.instructions || undefined,
      };
    }
  } catch (error) {
    console.error('Workspace AI error:', error);
  }

  return {
    content: "Ocorreu um erro ao processar a geração por IA. Por favor, tente novamente.",
    subject: "Erro de Geração",
  };
}
