'use client';

import { useState, useEffect } from 'react';
import { initWorkspaceAuth, googleWorkspaceSignIn, logoutWorkspace } from '@/lib/workspace';
import { GoogleSignInButton } from '@/components/google-signin-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  FileText, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  Plus, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Code, 
  Copy, 
  FileSpreadsheet, 
  ExternalLink, 
  Info,
  ChevronDown,
  Trash2,
  Check,
  Video,
  BookOpen,
  StickyNote,
  Volume2,
  VolumeX,
  Megaphone,
  UserCheck,
  Globe,
  Sliders,
  Play,
  Pause,
  Clock,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { executeWorkspaceAI } from '@/ai/flows/workspace-ai-flow';

// Standard Interfaces for Workspace Integrations
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

interface AppsScriptProject {
  scriptId: string;
  title: string;
  createTime: string;
}

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink?: string;
}

interface KeepNote {
  id: string;
  title: string;
  content: string;
  color: string;
  date: string;
}

export default function CRMPage() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  // Active workspace-wide tab
  const [activeTab, setActiveTab] = useState('gmail_docs');

  // Sub-tabs inside each module
  const [activeMailTab, setActiveMailTab] = useState('inbox');
  const [activeAdTab, setActiveAdTab] = useState('optimizer');

  // Loading States for API operations
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [isLoadingAppsScript, setIsLoadingAppsScript] = useState(false);
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(false);

  // Lists populated from Workspace REST APIs
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [scriptProjects, setScriptProjects] = useState<AppsScriptProject[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);

  // Local Google Keep State (persisted via localStorage for individual user account workspace)
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('#FEF3C7'); // Warm yellow

  // 1. Gmail State
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // 2. Gemini AI Campaign & Content Helper States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedInstructions, setGeneratedInstructions] = useState('');

  // 3. New Sheets / Docs / Slides / Forms Creation States
  const [newSheetTitle, setNewSheetTitle] = useState('Matondelo Planilha de Agendamentos');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  const [newDocTitle, setNewDocTitle] = useState('Matondelo Proposta de Serviços');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  const [newSlideTitle, setNewSlideTitle] = useState('Apresentação Corporativa Matondelo');
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);
  const [createdSlideUrl, setCreatedSlideUrl] = useState<string | null>(null);

  const [newFormTitle, setNewFormTitle] = useState('Pesquisa de Satisfação Matondelo');
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);

  // 4. Apps Script automation state
  const [isCreatingScriptProj, setIsCreatingScriptProj] = useState(false);
  const [createdScriptProjUrl, setCreatedScriptProjUrl] = useState<string | null>(null);

  // 5. Google Meet & Calendar States
  const [meetTitle, setMeetTitle] = useState('Reunião de Alinhamento - Parceiro Matondelo');
  const [meetDate, setMeetDate] = useState('2026-07-25');
  const [meetTime, setMeetTime] = useState('10:00');
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [createdMeetUrl, setCreatedMeetUrl] = useState<string | null>(null);

  // 6. Classroom State
  const [newClassName, setNewClassName] = useState('Treinamento de Atendimento ao Cliente');
  const [newClassSection, setNewClassSection] = useState('Parceiros Matondelo');
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // 7. Google Ads Simulation & Optimizer State
  const [adsBudget, setAdsBudget] = useState(5000); // Daily budget in AOA
  const [adsCPC, setAdsCPC] = useState(150); // Cost per Click in AOA
  const [adsKeywords, setAdsKeywords] = useState('entrega rápida Luanda, melhor pizzaria talatona, agendar taxi angola');
  const [adsLocation, setAdsLocation] = useState('Luanda, Angola');

  // 8. NotebookLM Research States
  const [notebookSelectedDoc, setNotebookSelectedDoc] = useState<string>('Nenhum documento selecionado (Usar Contexto Matondelo)');
  const [notebookBriefing, setNotebookBriefing] = useState<string>('');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);
  const [synthInstance, setSynthInstance] = useState<SpeechSynthesis | null>(null);

  // General helpers
  const [copied, setCopied] = useState(false);

  // Auth synchronization
  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (user, t) => {
        setUser(user);
        setToken(t);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync Google Keep from local storage initially
  useEffect(() => {
    const saved = localStorage.getItem('matondelo_keep_notes');
    if (saved) {
      setKeepNotes(JSON.parse(saved));
    } else {
      const defaultNotes: KeepNote[] = [
        {
          id: 'note-1',
          title: '💡 Ideia de Campanha',
          content: 'Enviar e-mail marketing pelo Gmail oferecendo desconto de 15% na primeira corrida de taxi ou pedido de comida neste final de semana!',
          color: '#FEF3C7',
          date: '24/07/2026 10:00'
        },
        {
          id: 'note-2',
          title: '📊 Faturamento Mensal',
          content: 'Manter a planilha Google Sheets atualizada para monitorar a comissão e vendas diárias.',
          color: '#D1FAE5',
          date: '24/07/2026 10:05'
        }
      ];
      setKeepNotes(defaultNotes);
      localStorage.setItem('matondelo_keep_notes', JSON.stringify(defaultNotes));
    }
  }, []);

  // Fetch initial workspace data when token changes or when navigating tabs
  useEffect(() => {
    if (token) {
      fetchDriveFiles();
      fetchGmailMessages();
      fetchScriptProjects();
      fetchClassroomCourses();
    }
  }, [token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleWorkspaceSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        toast({ title: 'Sucesso', description: 'Conectado ao Google Workspace com sucesso!' });
      }
    } catch (err) {
      console.error('Login failed:', err);
      toast({ variant: 'destructive', title: 'Erro de Login', description: 'Falha ao conectar com o Google Workspace.' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutWorkspace();
    setNeedsAuth(true);
    setToken(null);
    setUser(null);
  };

  // ==========================================
  // GOOGLE DRIVE API INTEGRATION
  // ==========================================
  const fetchDriveFiles = async () => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?pageSize=12&fields=files(id,name,mimeType,webViewLink)&q=trashed=false',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setDriveFiles(data.files || []);
      }
    } catch (e) {
      console.error('Error fetching drive files:', e);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // ==========================================
  // GMAIL API INTEGRATION
  // ==========================================
  const fetchGmailMessages = async () => {
    if (!token) return;
    setIsLoadingGmail(true);
    try {
      const listResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (listResponse.ok) {
        const listData = await listResponse.json();
        const messages: GmailMessage[] = [];

        if (listData.messages) {
          for (const msg of listData.messages) {
            const detailResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              const headers = detailData.payload.headers;
              const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sem Assunto)';
              const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Desconhecido';
              const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

              messages.push({
                id: detailData.id,
                threadId: detailData.threadId,
                snippet: detailData.snippet,
                subject,
                from,
                date: new Date(date).toLocaleDateString('pt-AO') + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              });
            }
          }
        }
        setGmailMessages(messages);
      }
    } catch (e) {
      console.error('Error fetching gmail messages:', e);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !emailTo || !emailSubject || !emailBody) {
      toast({ variant: 'destructive', title: 'Aviso', description: 'Por favor preencha todos os campos do e-mail.' });
      return;
    }

    setIsSendingEmail(true);
    try {
      const emailContent = [
        `To: ${emailTo}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${emailSubject}`,
        '',
        emailBody.replace(/\n/g, '<br />')
      ].join('\r\n');

      const base64SafeUrl = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: base64SafeUrl,
          }),
        }
      );

      if (response.ok) {
        toast({ title: 'E-mail Enviado!', description: `Mensagem enviada com sucesso para ${emailTo}` });
        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
        fetchGmailMessages();
      } else {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Falha ao enviar e-mail');
      }
    } catch (e: any) {
      console.error('Error sending email:', e);
      toast({ variant: 'destructive', title: 'Erro de Envio', description: e.message || 'Falha ao enviar o e-mail.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ==========================================
  // GOOGLE SHEETS API INTEGRATION
  // ==========================================
  const handleCreateSheet = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    setCreatedSheetUrl(null);

    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: newSheetTitle,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const sheetId = data.spreadsheetId;
        const webUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

        // Pre-populate sheet headers
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:F1:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [
                ['Cliente', 'E-mail', 'Serviço', 'Data/Hora', 'Estado', 'Preço (AOA)']
              ],
            }),
          }
        );

        setCreatedSheetUrl(webUrl);
        toast({ title: 'Planilha Criada!', description: 'Planilha de faturamento de agendamentos salva no Drive!' });
        fetchDriveFiles();
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar planilha');
      }
    } catch (e: any) {
      console.error('Sheet creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível criar a planilha.' });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // ==========================================
  // GOOGLE DOCS API INTEGRATION
  // ==========================================
  const handleCreateDoc = async (contentToWrite?: string) => {
    if (!token) return;
    setIsCreatingDoc(true);
    setCreatedDocUrl(null);

    try {
      const response = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDocTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const docId = data.documentId;
        const webUrl = `https://docs.google.com/document/d/${docId}/edit`;

        const docText = contentToWrite || 'Este documento foi gerado de forma automatizada pelo Ecossistema de Inteligência Matondelo.\n\nPronto para a sua colaboração!';
        await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: docText,
                  location: { index: 1 },
                },
              },
            ],
          }),
        });

        setCreatedDocUrl(webUrl);
        toast({ title: 'Documento Criado!', description: 'Google Doc criado com sucesso no seu Workspace!' });
        fetchDriveFiles();
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar documento');
      }
    } catch (e: any) {
      console.error('Doc creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível criar o documento.' });
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // ==========================================
  // GOOGLE SLIDES API INTEGRATION
  // ==========================================
  const handleCreateSlides = async (contentToWrite?: string) => {
    if (!token) return;
    setIsCreatingSlide(true);
    setCreatedSlideUrl(null);

    try {
      const response = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newSlideTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const presentationId = data.presentationId;
        const webUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

        setCreatedSlideUrl(webUrl);
        toast({ title: 'Apresentação Criada!', description: 'Sua nova apresentação de slides foi salva no seu Drive!' });
        fetchDriveFiles();
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar apresentação');
      }
    } catch (e: any) {
      console.error('Slides creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível criar os slides.' });
    } finally {
      setIsCreatingSlide(false);
    }
  };

  // ==========================================
  // GOOGLE FORMS API INTEGRATION
  // ==========================================
  const handleCreateForm = async () => {
    if (!token) return;
    setIsCreatingForm(true);
    setCreatedFormUrl(null);

    try {
      const response = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          info: {
            title: newFormTitle,
            documentTitle: newFormTitle,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const formId = data.formId;
        const webUrl = data.responderUri || `https://docs.google.com/forms/d/${formId}/edit`;

        setCreatedFormUrl(webUrl);
        toast({ title: 'Formulário Criado!', description: 'Seu formulário Google Forms foi publicado com sucesso!' });
        fetchDriveFiles();
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar formulário');
      }
    } catch (e: any) {
      console.error('Form creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível criar o formulário.' });
    } finally {
      setIsCreatingForm(false);
    }
  };

  // ==========================================
  // GOOGLE MEET & CALENDAR MEETING CREATOR
  // ==========================================
  const handleCreateMeetCall = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setIsCreatingMeet(true);
    setCreatedMeetUrl(null);

    try {
      const startDateTime = `${meetDate}T${meetTime}:00`;
      // Default duration: 1 hour
      const endHour = parseInt(meetTime.split(':')[0]) + 1;
      const endDateTime = `${meetDate}T${endHour < 10 ? '0' + endHour : endHour}:${meetTime.split(':')[1]}:00`;

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: meetTitle,
            description: 'Chamada do Google Meet gerada automaticamente via Ecossistema Integrado Matondelo.',
            start: {
              dateTime: startDateTime,
              timeZone: 'Africa/Luanda',
            },
            end: {
              dateTime: endDateTime,
              timeZone: 'Africa/Luanda',
            },
            conferenceData: {
              createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: {
                  type: 'hangoutsMeet',
                },
              },
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const meetUrl = data.hangoutLink || data.htmlLink;
        setCreatedMeetUrl(meetUrl);
        toast({ title: 'Reunião Marcada!', description: 'Sua videoconferência do Google Meet foi criada com link exclusivo.' });
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar evento de calendário');
      }
    } catch (e: any) {
      console.error('Meet creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível programar a chamada do Meet.' });
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // ==========================================
  // GOOGLE CLASSROOM API INTEGRATION
  // ==========================================
  const fetchClassroomCourses = async () => {
    if (!token) return;
    setIsLoadingClassroom(true);
    try {
      const response = await fetch(
        'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setClassroomCourses(data.courses || []);
      }
    } catch (e) {
      console.error('Error fetching Classroom courses:', e);
    } finally {
      setIsLoadingClassroom(false);
    }
  };

  const handleCreateClassroomCourse = async () => {
    if (!token) return;
    setIsCreatingClass(true);

    try {
      const response = await fetch('https://classroom.googleapis.com/v1/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClassName,
          section: newClassSection,
          descriptionHeading: 'Criado via Matondelo Hub',
          ownerId: 'me',
          courseState: 'ACTIVE',
        }),
      });

      if (response.ok) {
        toast({ title: 'Curso Criado!', description: `Curso "${newClassName}" publicado com sucesso no Google Classroom!` });
        setNewClassName('');
        fetchClassroomCourses();
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar turma');
      }
    } catch (e: any) {
      console.error('Classroom creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível publicar no Google Classroom.' });
    } finally {
      setIsCreatingClass(false);
    }
  };

  // ==========================================
  // APPS SCRIPT API INTEGRATION
  // ==========================================
  const fetchScriptProjects = async () => {
    if (!token) return;
    setIsLoadingAppsScript(true);
    try {
      const response = await fetch(
        'https://script.googleapis.com/v1/projects?pageSize=5',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setScriptProjects(data.projects || []);
      }
    } catch (e) {
      console.error('Error fetching Apps Script projects:', e);
    } finally {
      setIsLoadingAppsScript(false);
    }
  };

  const handleCreateScriptProject = async () => {
    if (!token) return;
    setIsCreatingScriptProj(true);
    setCreatedScriptProjUrl(null);
    try {
      const response = await fetch('https://script.googleapis.com/v1/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Automação Matondelo IA',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const scriptId = data.scriptId;
        const webUrl = `https://script.google.com/d/${scriptId}/edit`;
        setCreatedScriptProjUrl(webUrl);
        toast({ title: 'Projeto Apps Script!', description: 'Projeto criado no seu console do Google Apps Script!' });
        fetchScriptProjects();
      } else {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro ao criar projeto');
      }
    } catch (e: any) {
      console.error('Script project creation error:', e);
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível criar o projeto Apps Script.' });
    } finally {
      setIsCreatingScriptProj(false);
    }
  };

  // ==========================================
  // LOCAL GOOGLE KEEP HELPER (PINS & STICKIES)
  // ==========================================
  const handleAddKeepNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: KeepNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle,
      content: newNoteContent,
      color: newNoteColor,
      date: new Date().toLocaleDateString('pt-AO') + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    };

    const updated = [newNote, ...keepNotes];
    setKeepNotes(updated);
    localStorage.setItem('matondelo_keep_notes', JSON.stringify(updated));

    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteColor('#FEF3C7');
    toast({ title: 'Nota Salva!', description: 'Adicionada ao seu painel Google Keep virtual!' });
  };

  const handleDeleteKeepNote = (id: string) => {
    const updated = keepNotes.filter(n => n.id !== id);
    setKeepNotes(updated);
    localStorage.setItem('matondelo_keep_notes', JSON.stringify(updated));
    toast({ title: 'Nota Excluída', description: 'Removida do painel Keep.' });
  };

  // ==========================================
  // GEMINI WORKSPACE AI GENERATION
  // ==========================================
  const handleGenerateAI = async (type: 'email_campaign' | 'document_generation' | 'apps_script_automation' | 'slides_generation' | 'classroom_curriculum' | 'forms_structure' | 'ads_optimization' | 'keep_notes' | 'meet_agenda' | 'notebook_lm') => {
    if (!aiPrompt.trim()) {
      toast({ variant: 'destructive', title: 'Aviso', description: 'Por favor, escreva uma instrução para a IA.' });
      return;
    }

    setIsGeneratingAI(true);
    setGeneratedSubject('');
    setGeneratedContent('');
    setGeneratedInstructions('');

    try {
      const res = await executeWorkspaceAI({
        type,
        prompt: aiPrompt,
        context: aiContext || `Business of user ${user?.email} on Matondelo Angola`,
      });

      setGeneratedSubject(res.subject || '');
      setGeneratedContent(res.content || '');
      if (res.instructions) {
        setGeneratedInstructions(res.instructions);
      }

      toast({ title: 'Mati IA Concluída!', description: 'Material estruturado com sucesso para o Workspace!' });
    } catch (error) {
      console.error('Gemini error:', error);
      toast({ variant: 'destructive', title: 'Erro de Geração', description: 'Ocorreu um problema ao comunicar com o Gemini.' });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ==========================================
  // NOTEBOOKLM GROUNDED ENGINE & TTS SPEAKER
  // ==========================================
  const handleNotebookSynthesis = async () => {
    setIsGeneratingBriefing(true);
    setNotebookBriefing('');
    try {
      const fileContext = notebookSelectedDoc !== 'Nenhum documento selecionado (Usar Contexto Matondelo)' 
        ? `Grounded Context Document Name: ${notebookSelectedDoc}` 
        : `Grounded on all business sales and customer interaction logs of Matondelo.`;

      const promptText = `Generate a synthesis briefing on "${fileContext}". Focus on optimizing regional business in Angola. Include Host A (Alex) and Host B (Brenda) discussing business metrics, strengths, and areas to improve in Luanda.`;
      
      const res = await executeWorkspaceAI({
        type: 'notebook_lm',
        prompt: promptText,
        context: `User: ${user?.email} business workspace context.`,
      });

      setNotebookBriefing(res.content || '');
      toast({ title: 'NotebookLM Concluído', description: 'Audio Briefing gerado com sucesso! Pronto para audição.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro NotebookLM', description: 'Ocorreu um erro ao rodar a síntese.' });
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const toggleBriefingAudio = () => {
    if (!window.speechSynthesis) {
      toast({ variant: 'destructive', title: 'Erro de Áudio', description: 'Seu navegador não suporta síntese de voz (TTS).' });
      return;
    }

    if (isBriefingPlaying) {
      window.speechSynthesis.cancel();
      setIsBriefingPlaying(false);
    } else {
      // Clean markdown tags to read cleanly
      const textToSpeak = notebookBriefing
        .replace(/[*#_\-`]/g, '')
        .replace(/Host A:/gi, 'Apresentador um diz:')
        .replace(/Host B:/gi, 'Apresentadora dois diz:')
        .substring(0, 800); // Limit speech length for a clean summary

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.0;
      utterance.onend = () => setIsBriefingPlaying(false);
      utterance.onerror = () => setIsBriefingPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsBriefingPlaying(true);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent || notebookBriefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copiado!', description: 'Copiado para a área de transferência.' });
  };

  // Apply AI Generated Content to Form fields
  const applyGeneratedEmail = () => {
    setEmailSubject(generatedSubject);
    setEmailBody(generatedContent);
    toast({ title: 'Aplicado', description: 'E-mail preenchido com a sugestão da IA!' });
  };

  if (needsAuth) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[75vh] space-y-8 max-w-4xl" id="workspace_auth_container">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0F3460]/10 flex items-center justify-center text-[#0F3460] mb-4">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Ecossistema Total Google & IA
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tenha acesso completo e seguro ao Gmail, Google Drive, Google Sheets, Google Docs, Slides, Classroom, Forms, Meet e Keep, integrado diretamente com a inteligência artificial do Gemini para otimizar suas operações corporativas em Angola!
          </p>
        </div>
        <Card className="p-8 w-full max-w-lg flex flex-col items-center justify-center space-y-6 shadow-xl border-t-4 border-t-[#0F3460] bg-card" id="workspace_platforms_card">
          <div className="grid grid-cols-4 gap-6 text-[#0F3460] w-full text-center">
            <div className="flex flex-col items-center gap-1">
              <Mail className="w-7 h-7 text-blue-600" />
              <span className="text-[10px] font-semibold text-muted-foreground">Gmail</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
              <span className="text-[10px] font-semibold text-muted-foreground">Sheets</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <FileText className="w-7 h-7 text-blue-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">Docs</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Video className="w-7 h-7 text-red-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">Meet</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <BookOpen className="w-7 h-7 text-orange-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">Classroom</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <StickyNote className="w-7 h-7 text-amber-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">Keep</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Megaphone className="w-7 h-7 text-indigo-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">Ads</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-7 h-7 text-purple-600" />
              <span className="text-[10px] font-semibold text-muted-foreground">NotebookLM</span>
            </div>
          </div>
          <div className="text-center space-y-1 border-t border-muted pt-4 w-full">
            <h3 className="font-bold text-sm">Integração Total Segura via OAuth 2.0</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Ao conectar sua conta, você poderá criar, editar e consultar seus arquivos oficiais diretamente da plataforma com total privacidade.
            </p>
          </div>
          <GoogleSignInButton onClick={handleLogin} isLoading={isLoggingIn} />
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500" id="workspace_crm_dashboard">
      
      {/* Header Suite */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/40 p-6 rounded-2xl border border-muted-foreground/10" id="workspace_header_block">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> OAuth 2.0 Ativo
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3460]/10 text-[#0F3460] border border-[#0F3460]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash Habilitado
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> NotebookLM Prontificado
            </span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight mt-2 text-foreground">
            Workspace Matondelo & Inteligência Artificial
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            Conectado com a conta: <strong className="text-foreground">{user?.email}</strong>
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 transition-all text-xs">
          <LogOut className="w-4 h-4" />
          Desconectar Google Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8" id="workspace_grid_layout">
        
        {/* LEFT COLUMN: MATI ASSISTANT - AI GENERATOR SIDEBAR */}
        <div className="xl:col-span-1 space-y-6" id="mati_assistant_sidebar">
          <Card className="border-t-4 border-t-[#0F3460] shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-[#0F3460]">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg font-bold">Assistente Mati IA</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Crie propostas de e-mail marketing, cronogramas de aulas, códigos do Apps Script, apresentações corporativas e muito mais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="aiPrompt" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">O que pretende criar?</Label>
                <Textarea 
                  id="aiPrompt"
                  placeholder="Ex: 'Criar uma apresentação de slides de proposta para patrocinadores em Angola' ou 'Projetar um formulário Google Forms para coletar dados de agendamento de taxi'."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[110px] text-xs leading-relaxed"
                  disabled={isGeneratingAI}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aiContext" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contexto Comercial (Opcional)</Label>
                <Input 
                  id="aiContext"
                  placeholder="Ex: Luanda, Talatona, Delivery, Orçamento em AOA..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  className="text-xs h-9"
                  disabled={isGeneratingAI}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button 
                  onClick={() => handleGenerateAI('email_campaign')}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-[#0F3460] hover:bg-[#1a4475] text-white flex items-center justify-start gap-2 text-xs py-2 h-9 w-full font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Gerar E-mail Marketing
                </Button>
                <Button 
                  onClick={() => handleGenerateAI('document_generation')}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-start gap-2 text-xs py-2 h-9 w-full font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Gerar Google Doc
                </Button>
                <Button 
                  onClick={() => handleGenerateAI('slides_generation')}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-start gap-2 text-xs py-2 h-9 w-full font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Gerar Outline de Slides
                </Button>
                <Button 
                  onClick={() => handleGenerateAI('classroom_curriculum')}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-start gap-2 text-xs py-2 h-9 w-full font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ementa do Google Classroom
                </Button>
                <Button 
                  onClick={() => handleGenerateAI('forms_structure')}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-start gap-2 text-xs py-2 h-9 w-full font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Gerar Perguntas de Formulário
                </Button>
                <Button 
                  onClick={() => handleGenerateAI('apps_script_automation')}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-start gap-2 text-xs py-2 h-9 w-full font-medium"
                >
                  <Code className="w-3.5 h-3.5" />
                  Gerar Apps Script Código
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI OUTPUT CONTAINER VIEW */}
          {(generatedContent || isGeneratingAI) && (
            <Card className="border border-[#0F3460]/20 bg-[#0F3460]/5 shadow-sm animate-in fade-in duration-300" id="ai_output_viewer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-[#0F3460]">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Resultado da Mati IA
                    </CardTitle>
                    {generatedSubject && (
                      <p className="text-xs font-semibold text-foreground mt-1">Título: {generatedSubject}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {generatedContent && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground" onClick={handleCopyToClipboard}>
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGeneratingAI ? (
                  <div className="space-y-2 py-4">
                    <div className="h-3 bg-muted rounded-full animate-pulse w-full" />
                    <div className="h-3 bg-muted rounded-full animate-pulse w-5/6" />
                    <div className="h-3 bg-muted rounded-full animate-pulse w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="bg-card p-3 rounded-lg border border-border text-[11px] max-h-[220px] overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                      {generatedContent}
                    </div>

                    {/* Conditional CTA Action based on what was generated */}
                    {generatedSubject && generatedContent && (
                      <div className="pt-2 border-t border-[#0F3460]/10 flex flex-col gap-2">
                        {aiPrompt.toLowerCase().includes('email') || aiPrompt.toLowerCase().includes('campanha') ? (
                          <Button 
                            className="bg-[#0F3460] hover:bg-[#1a4475] text-white w-full text-xs h-8" 
                            onClick={applyGeneratedEmail}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Aplicar ao Compositor de Gmail
                          </Button>
                        ) : aiPrompt.toLowerCase().includes('apresentação') || aiPrompt.toLowerCase().includes('slides') ? (
                          <Button 
                            className="bg-amber-600 hover:bg-amber-700 text-white w-full text-xs h-8" 
                            onClick={() => {
                              setNewSlideTitle(generatedSubject);
                              handleCreateSlides();
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Criar no Google Slides
                          </Button>
                        ) : (
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xs h-8" 
                            onClick={() => {
                              setNewDocTitle(generatedSubject);
                              handleCreateDoc(generatedContent);
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" /> Criar como Google Doc
                          </Button>
                        )}
                      </div>
                    )}

                    {generatedInstructions && (
                      <div className="bg-muted p-2.5 rounded-lg text-[10px] space-y-1">
                        <p className="font-bold flex items-center gap-1"><Info className="w-3 h-3 text-blue-500" /> Instruções de Instalação:</p>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{generatedInstructions}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: GOOGLE WORKSPACE MASTER TABS */}
        <div className="xl:col-span-3 space-y-6" id="workspace_core_tabs_container">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 mb-6 bg-muted p-1 rounded-xl">
              <TabsTrigger value="gmail_docs" className="rounded-lg text-xs flex items-center justify-center gap-1.5 py-2">
                <Mail className="w-3.5 h-3.5 text-blue-600"/> Gmail & Docs
              </TabsTrigger>
              <TabsTrigger value="slides_forms" className="rounded-lg text-xs flex items-center justify-center gap-1.5 py-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500"/> Slides & Forms
              </TabsTrigger>
              <TabsTrigger value="meet_keep" className="rounded-lg text-xs flex items-center justify-center gap-1.5 py-2">
                <Video className="w-3.5 h-3.5 text-red-500"/> Meet & Keep
              </TabsTrigger>
              <TabsTrigger value="ads" className="rounded-lg text-xs flex items-center justify-center gap-1.5 py-2">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600"/> Google Ads
              </TabsTrigger>
              <TabsTrigger value="notebooklm" className="rounded-lg text-xs flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5 text-purple-600"/> NotebookLM Room
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: GMAIL, CAMPAIGNS, DOCS & SHEETS */}
            <TabsContent value="gmail_docs" className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Gmail Portal */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-blue-600" /> Correio Eletrónico & Inbox
                      </CardTitle>
                      <CardDescription className="text-xs">Consulte as mensagens mais recentes do seu correio.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchGmailMessages} disabled={isLoadingGmail}>
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs value={activeMailTab} onValueChange={setActiveMailTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-3 bg-muted/60 p-0.5 rounded-lg h-8">
                        <TabsTrigger value="inbox" className="text-[11px] py-1">Ver Entrada</TabsTrigger>
                        <TabsTrigger value="compose" className="text-[11px] py-1">Escrever E-mail</TabsTrigger>
                      </TabsList>

                      <TabsContent value="inbox" className="space-y-3">
                        {isLoadingGmail ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((n) => (
                              <div key={n} className="flex flex-col gap-1 py-1.5 border-b border-muted">
                                <div className="h-3 bg-muted rounded w-2/3" />
                                <div className="h-2.5 bg-muted rounded w-5/6" />
                              </div>
                            ))}
                          </div>
                        ) : gmailMessages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-xs">
                            Nenhum e-mail recente localizado na sua caixa.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {gmailMessages.map((msg) => (
                              <div key={msg.id} className="p-2.5 bg-muted/30 rounded-lg border border-border flex flex-col gap-0.5">
                                <div className="flex justify-between items-center text-[10px]">
                                  <strong className="text-primary truncate max-w-[120px]">{msg.from}</strong>
                                  <span className="text-muted-foreground">{msg.date}</span>
                                </div>
                                <h4 className="text-xs font-semibold text-foreground truncate">{msg.subject}</h4>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{msg.snippet}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="compose" className="space-y-3">
                        <form onSubmit={handleSendEmail} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="emailTo" className="text-[10px] font-bold">Destinatário</Label>
                            <Input 
                              id="emailTo"
                              placeholder="Ex: cliente@email.com"
                              value={emailTo}
                              onChange={(e) => setEmailTo(e.target.value)}
                              className="text-xs h-8"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="emailSubject" className="text-[10px] font-bold">Assunto</Label>
                            <Input 
                              id="emailSubject"
                              placeholder="Assunto da mensagem"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              className="text-xs h-8"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="emailBody" className="text-[10px] font-bold">Corpo da Mensagem</Label>
                            <Textarea 
                              id="emailBody"
                              placeholder="Escreva sua mensagem profissional..."
                              value={emailBody}
                              onChange={(e) => setEmailBody(e.target.value)}
                              className="min-h-[100px] text-xs leading-relaxed"
                              required
                            />
                          </div>
                          <Button type="submit" disabled={isSendingEmail} className="w-full bg-[#0F3460] hover:bg-[#15467e] text-white text-xs h-8 flex items-center justify-center gap-1.5">
                            {isSendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Enviar Mensagem Oficial
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Docs & Sheets Creation Station */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Planilhas & Documentos
                      </CardTitle>
                      <CardDescription className="text-xs">Gere e preencha planilhas ou documentos comerciais.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Sheet Generator */}
                    <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-2">
                      <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Criar Google Sheets
                      </h4>
                      <div className="flex gap-2">
                        <Input 
                          value={newSheetTitle} 
                          onChange={(e) => setNewSheetTitle(e.target.value)} 
                          className="text-xs h-8 bg-card"
                          placeholder="Nome da planilha"
                        />
                        <Button onClick={handleCreateSheet} disabled={isCreatingSheet} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                          {isCreatingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Criar
                        </Button>
                      </div>
                      {createdSheetUrl && (
                        <p className="text-[10px] text-green-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> 
                          <a href={createdSheetUrl} target="_blank" rel="noreferrer" className="underline font-bold">Abrir Planilha Criada</a>
                        </p>
                      )}
                    </div>

                    {/* Document Generator */}
                    <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-2">
                      <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Criar Google Docs
                      </h4>
                      <div className="flex gap-2">
                        <Input 
                          value={newDocTitle} 
                          onChange={(e) => setNewDocTitle(e.target.value)} 
                          className="text-xs h-8 bg-card"
                          placeholder="Nome do documento"
                        />
                        <Button onClick={() => handleCreateDoc()} disabled={isCreatingDoc} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                          {isCreatingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Criar
                        </Button>
                      </div>
                      {createdDocUrl && (
                        <p className="text-[10px] text-blue-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> 
                          <a href={createdDocUrl} target="_blank" rel="noreferrer" className="underline font-bold">Abrir Documento Criado</a>
                        </p>
                      )}
                    </div>

                  </CardContent>
                </Card>

              </div>

              {/* General Drive Files Directory browser */}
              <Card className="shadow-sm">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold">Lista de Arquivos no Google Drive</CardTitle>
                    <CardDescription className="text-xs">Documentos de faturamento, apresentações e propostas salvos de forma segura.</CardDescription>
                  </div>
                  <Button variant="ghost" size="xs" onClick={fetchDriveFiles} className="text-xs flex items-center gap-1">
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} /> Atualizar Drive
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingDrive ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-11/12 animate-pulse" />
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                      Nenhum arquivo recente localizado no Google Drive.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {driveFiles.map((file) => (
                        <div key={file.id} className="p-3 bg-muted/40 rounded-xl border border-border flex items-start gap-2 justify-between">
                          <div className="flex items-start gap-2 truncate">
                            {file.mimeType.includes('spreadsheet') ? (
                              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : file.mimeType.includes('presentation') ? (
                              <FileSpreadsheet className="w-5 h-5 text-amber-500 shrink-0" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                            )}
                            <div className="truncate text-left">
                              <p className="text-xs font-semibold truncate text-foreground">{file.name}</p>
                              <span className="text-[9px] text-muted-foreground block truncate">ID: {file.id}</span>
                            </div>
                          </div>
                          <Button asChild size="xs" variant="ghost" className="h-6 w-6 p-0 text-[#0F3460] hover:bg-muted">
                            <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: SLIDES, FORMS & CLASSROOM */}
            <TabsContent value="slides_forms" className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Slides & Forms Deck */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-amber-600">
                      <Sparkles className="w-4 h-4" /> Google Slides & Forms Studio
                    </CardTitle>
                    <CardDescription className="text-xs">Crie slides de pitches corporativos ou formulários de feedback.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Slides Creation */}
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                      <Label htmlFor="slidesTitle" className="text-xs font-semibold">Título dos Slides</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="slidesTitle"
                          value={newSlideTitle}
                          onChange={(e) => setNewSlideTitle(e.target.value)}
                          className="text-xs h-8 bg-card"
                        />
                        <Button onClick={() => handleCreateSlides()} disabled={isCreatingSlide} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">
                          {isCreatingSlide ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Gerar Slides
                        </Button>
                      </div>
                      {createdSlideUrl && (
                        <p className="text-[10px] text-amber-600 font-bold">
                          <a href={createdSlideUrl} target="_blank" rel="noreferrer" className="underline">Aceder Apresentação de Slides</a>
                        </p>
                      )}
                    </div>

                    {/* Forms Creation */}
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                      <Label htmlFor="formTitle" className="text-xs font-semibold">Título do Google Forms</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="formTitle"
                          value={newFormTitle}
                          onChange={(e) => setNewFormTitle(e.target.value)}
                          className="text-xs h-8 bg-card"
                        />
                        <Button onClick={handleCreateForm} disabled={isCreatingForm} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
                          {isCreatingForm ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Criar Form
                        </Button>
                      </div>
                      {createdFormUrl && (
                        <p className="text-[10px] text-purple-600 font-bold">
                          <a href={createdFormUrl} target="_blank" rel="noreferrer" className="underline">Visualizar Formulário Publicado</a>
                        </p>
                      )}
                    </div>

                  </CardContent>
                </Card>

                {/* Google Classroom Portal */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
                        <BookOpen className="w-4 h-4" /> Google Classroom
                      </CardTitle>
                      <CardDescription className="text-xs">Crie e acompanhe treinamentos para sua equipe ou alunos.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchClassroomCourses} disabled={isLoadingClassroom}>
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClassroom ? 'animate-spin' : ''}`} />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 bg-muted/50 p-3 rounded-lg border border-border">
                      <h4 className="text-xs font-bold">Publicar Nova Turma</h4>
                      <div className="space-y-2">
                        <Input 
                          placeholder="Nome da Turma / Curso"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          className="text-xs h-8 bg-card"
                        />
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Secção/Área"
                            value={newClassSection}
                            onChange={(e) => setNewClassSection(e.target.value)}
                            className="text-xs h-8 bg-card"
                          />
                          <Button onClick={handleCreateClassroomCourse} disabled={isCreatingClass || !newClassName.trim()} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                            {isCreatingClass ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Criar Turma
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Turmas Ativas</h4>
                      {isLoadingClassroom ? (
                        <div className="h-6 bg-muted rounded animate-pulse" />
                      ) : classroomCourses.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground">Nenhuma turma ativa encontrada no Google Classroom.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {classroomCourses.map((c) => (
                            <div key={c.id} className="p-2 bg-card rounded border border-border text-xs flex justify-between items-center">
                              <div>
                                <strong className="text-[#0F3460]">{c.name}</strong>
                                <span className="text-[9px] text-muted-foreground block">{c.section || 'Turma Geral'}</span>
                              </div>
                              {c.alternateLink && (
                                <Button asChild size="xs" variant="ghost">
                                  <a href={c.alternateLink} target="_blank" rel="noopener noreferrer">
                                    Aceder <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* TAB 3: MEET, CALENDAR & KEEP */}
            <TabsContent value="meet_keep" className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Google Meet & Calendar */}
                <Card className="lg:col-span-1 shadow-sm h-fit">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-red-500">
                      <Video className="w-4 h-4" /> Google Meet Videochamadas
                    </CardTitle>
                    <CardDescription className="text-xs">Programe videoconferências virtuais com link exclusivo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleCreateMeetCall} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="meetTitle" className="text-[10px] font-bold">Título da Reunião</Label>
                        <Input 
                          id="meetTitle"
                          value={meetTitle}
                          onChange={(e) => setMeetTitle(e.target.value)}
                          className="text-xs h-8"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="meetDate" className="text-[10px] font-bold">Data da Reunião</Label>
                          <Input 
                            id="meetDate"
                            type="date"
                            value={meetDate}
                            onChange={(e) => setMeetDate(e.target.value)}
                            className="text-xs h-8"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="meetTime" className="text-[10px] font-bold">Hora da Reunião</Label>
                          <Input 
                            id="meetTime"
                            type="time"
                            value={meetTime}
                            onChange={(e) => setMeetTime(e.target.value)}
                            className="text-xs h-8"
                            required
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isCreatingMeet} className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-8 flex items-center justify-center gap-1.5">
                        {isCreatingMeet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                        Gerar Chamada Meet
                      </Button>
                    </form>

                    {createdMeetUrl && (
                      <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs space-y-1.5">
                        <p className="font-bold">Link da Reunião Ativo:</p>
                        <div className="flex gap-2">
                          <Input value={createdMeetUrl} readOnly className="text-[11px] h-7 bg-white flex-1" />
                          <Button asChild size="xs" variant="outline" className="border-red-300">
                            <a href={createdMeetUrl} target="_blank" rel="noreferrer">Aceder</a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Google Keep Sticky Notes */}
                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-amber-500">
                      <StickyNote className="w-4 h-4" /> Notas do Google Keep
                    </CardTitle>
                    <CardDescription className="text-xs">Guarde anotações, lembretes de clientes e ideias de automação instantâneas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleAddKeepNote} className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input 
                          placeholder="Título da Nota"
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          className="text-xs h-8 bg-card"
                          required
                        />
                        <div className="flex gap-1.5 items-center justify-end">
                          <span className="text-[10px] text-muted-foreground mr-1">Cor:</span>
                          <button type="button" onClick={() => setNewNoteColor('#FEF3C7')} className={`w-5 h-5 rounded-full bg-[#FEF3C7] border ${newNoteColor === '#FEF3C7' ? 'ring-2 ring-primary' : 'border-muted-foreground/30'}`} />
                          <button type="button" onClick={() => setNewNoteColor('#D1FAE5')} className={`w-5 h-5 rounded-full bg-[#D1FAE5] border ${newNoteColor === '#D1FAE5' ? 'ring-2 ring-primary' : 'border-muted-foreground/30'}`} />
                          <button type="button" onClick={() => setNewNoteColor('#DBEAFE')} className={`w-5 h-5 rounded-full bg-[#DBEAFE] border ${newNoteColor === '#DBEAFE' ? 'ring-2 ring-primary' : 'border-muted-foreground/30'}`} />
                          <button type="button" onClick={() => setNewNoteColor('#F3E8FF')} className={`w-5 h-5 rounded-full bg-[#F3E8FF] border ${newNoteColor === '#F3E8FF' ? 'ring-2 ring-primary' : 'border-muted-foreground/30'}`} />
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Conteúdo ou lista de afazeres..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="text-xs min-h-[60px]"
                        required
                      />
                      <Button type="submit" size="sm" className="bg-[#0F3460] hover:bg-[#15467e] text-white text-xs h-8 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar Nota
                      </Button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pt-2">
                      {keepNotes.map((note) => (
                        <div 
                          key={note.id} 
                          style={{ backgroundColor: note.color }} 
                          className="p-3.5 rounded-xl border border-muted-foreground/10 text-foreground shadow-sm flex flex-col justify-between space-y-2 relative group"
                        >
                          <div>
                            <h4 className="text-xs font-bold mb-1">{note.title}</h4>
                            <p className="text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap">{note.content}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-black/5 text-[9px] text-slate-600">
                            <span>{note.date}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 hover:bg-black/10 rounded" 
                              onClick={() => handleDeleteKeepNote(note.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* TAB 4: GOOGLE ADS INTEGRATION & SIMULATOR */}
            <TabsContent value="ads" className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5 text-indigo-600">
                    <Megaphone className="w-5 h-5"/> Google Ads Campaign Optimizer & Simulator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Estruture e otimize suas campanhas de publicidade do Google Ads direcionadas ao público de Luanda e províncias em Angola.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Setup Campaign parameters */}
                    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Parâmetros de Tráfego
                      </h3>
                      
                      <div className="space-y-1">
                        <Label htmlFor="adsLocation" className="text-xs">Localização do Público</Label>
                        <Input 
                          id="adsLocation" 
                          value={adsLocation} 
                          onChange={(e) => setAdsLocation(e.target.value)} 
                          className="text-xs h-8 bg-card"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="adsKeywords" className="text-xs">Palavras-Chave Foco</Label>
                        <Textarea 
                          id="adsKeywords" 
                          value={adsKeywords} 
                          onChange={(e) => setAdsKeywords(e.target.value)} 
                          className="text-xs min-h-[60px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="adsBudget" className="text-xs">Verba Diária (AOA)</Label>
                          <Input 
                            id="adsBudget" 
                            type="number"
                            value={adsBudget} 
                            onChange={(e) => setAdsBudget(parseInt(e.target.value) || 0)} 
                            className="text-xs h-8 bg-card"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="adsCPC" className="text-xs">CPC Máximo (AOA)</Label>
                          <Input 
                            id="adsCPC" 
                            type="number"
                            value={adsCPC} 
                            onChange={(e) => setAdsCPC(parseInt(e.target.value) || 1)} 
                            className="text-xs h-8 bg-card"
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-[#0F3460] hover:bg-[#15467e] text-white text-xs h-8"
                        onClick={() => {
                          setAiPrompt(`Gerar uma campanha de Google Ads com base nas palavras-chave: "${adsKeywords}" para a região de ${adsLocation}. Sugira 3 headlines marcantes e estimativas.`);
                          handleGenerateAI('ads_optimization');
                        }}
                      >
                        Otimizar Campanha com Gemini AI
                      </Button>
                    </div>

                    {/* Simulation and Ads Mockup Live Output */}
                    <div className="lg:col-span-2 space-y-4">
                      
                      {/* Search Results Preview */}
                      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3 text-left">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3 text-indigo-500" /> Pré-visualização do Google Search (Móbile/Desktop)</span>
                        <div className="border border-muted p-3.5 rounded-lg space-y-1 max-w-lg bg-white">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1 rounded">Anúncio</span>
                            <span className="text-[10px] text-slate-500 truncate">https://www.matondelo.com/{adsLocation.toLowerCase().split(',')[0]}</span>
                          </div>
                          <h3 className="text-sm font-bold text-blue-800 hover:underline cursor-pointer">
                            {newSlideTitle || 'Serviços Matondelo Angola - Agende com Rapidez'}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            A maior rede de taxi, entregas e agendamentos locais em {adsLocation}. Economize tempo e dinheiro com profissionais avaliados.
                          </p>
                        </div>
                      </div>

                      {/* ROI Calculator Calculator card */}
                      <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-4 rounded-xl border border-indigo-100 text-left space-y-3">
                        <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                          <Sliders className="w-4 h-4" /> Simulador de Métricas Trimestrais (Matondelo Angola)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-2.5 rounded-lg border border-border">
                            <span className="text-[9px] text-muted-foreground block font-medium">Cliques Mensais</span>
                            <strong className="text-sm text-foreground">{Math.floor((adsBudget / adsCPC) * 30)}</strong>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-border">
                            <span className="text-[9px] text-muted-foreground block font-medium">Impressões Est.</span>
                            <strong className="text-sm text-foreground">{Math.floor(((adsBudget / adsCPC) * 30) * 18)}</strong>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-border">
                            <span className="text-[9px] text-muted-foreground block font-medium">Custo Mensal</span>
                            <strong className="text-sm text-foreground">{(adsBudget * 30).toLocaleString('pt-AO')} Kz</strong>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-border">
                            <span className="text-[9px] text-muted-foreground block font-medium">CTR Previsto</span>
                            <strong className="text-sm text-green-600">5.4%</strong>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: NOTEBOOKLM AI ROOM (DOCUMENT SYNTHESIS & PODCAST SCRIPT PLAYER) */}
            <TabsContent value="notebooklm" className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-lg border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-purple-100 py-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                      <div>
                        <CardTitle className="text-base font-headline font-bold">NotebookLM Otimizado com Gemini 2.5</CardTitle>
                        <CardDescription className="text-xs text-purple-800">Seu centro de pesquisa, síntese de documentos de negócios e áudio briefing.</CardDescription>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500 text-white animate-pulse">
                      Grounded AI Engine
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Document selector column */}
                    <div className="space-y-4 bg-purple-50/30 p-4 rounded-xl border border-purple-100/50">
                      <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Escolher Documento de Fonte
                      </h3>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground">O NotebookLM sintetiza informações a partir de arquivos selecionados do seu Drive ou local.</p>
                        
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pt-1">
                          <button 
                            onClick={() => setNotebookSelectedDoc('Nenhum documento selecionado (Usar Contexto Matondelo)')}
                            className={`w-full p-2 text-left text-xs rounded border transition-all ${notebookSelectedDoc === 'Nenhum documento selecionado (Usar Contexto Matondelo)' ? 'bg-purple-100 border-purple-300 font-bold' : 'bg-card hover:bg-muted border-border'}`}
                          >
                            📁 Todos os Dados Matondelo
                          </button>
                          {driveFiles.map((file) => (
                            <button
                              key={file.id}
                              onClick={() => setNotebookSelectedDoc(file.name)}
                              className={`w-full p-2 text-left text-xs rounded border truncate transition-all ${notebookSelectedDoc === file.name ? 'bg-purple-100 border-purple-300 font-bold' : 'bg-card hover:bg-muted border-border'}`}
                            >
                              📄 {file.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button 
                          onClick={handleNotebookSynthesis}
                          disabled={isGeneratingBriefing}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 flex items-center justify-center gap-1.5"
                        >
                          {isGeneratingBriefing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Gerar Briefing Completo
                        </Button>
                      </div>
                    </div>

                    {/* Synthesis & Audio Player Output */}
                    <div className="lg:col-span-2 space-y-4">
                      
                      {notebookBriefing ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          
                          {/* Audio Briefing Media Player */}
                          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-xl text-white flex items-center justify-between gap-4">
                            <div className="space-y-1 text-left">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-purple-200">Audio Briefing - NotebookLM Pod</span>
                              <h4 className="text-sm font-bold truncate max-w-[250px]">{notebookSelectedDoc}</h4>
                              <p className="text-[10px] text-purple-300">Duas vozes sintéticas discutindo seus dados corporativos.</p>
                            </div>
                            <Button 
                              onClick={toggleBriefingAudio}
                              className="bg-white hover:bg-purple-100 text-purple-950 rounded-full w-12 h-12 p-0 flex items-center justify-center shrink-0 shadow-lg"
                            >
                              {isBriefingPlaying ? <Pause className="w-6 h-6 fill-purple-950" /> : <Play className="w-6 h-6 fill-purple-950 ml-1" />}
                            </Button>
                          </div>

                          {/* Grounded text feedback */}
                          <div className="bg-card p-4 rounded-xl border border-purple-100 text-left space-y-3 shadow-sm max-h-[250px] overflow-y-auto">
                            <div className="flex justify-between items-center pb-2 border-b border-purple-50">
                              <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                                <FileText className="w-4 h-4" /> Transcrição do Estudo & Análise
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0F3460]" onClick={handleCopyToClipboard}>
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line prose max-w-none">
                              {notebookBriefing}
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="h-full min-h-[200px] flex flex-col items-center justify-center border border-dashed rounded-xl p-8 text-center text-muted-foreground space-y-3">
                          <Clock className="w-8 h-8 text-purple-300 animate-pulse" />
                          <div>
                            <h4 className="text-sm font-bold">Nenhum áudio gerado ainda</h4>
                            <p className="text-xs max-w-sm mt-1">Selecione uma fonte ou use a base de dados integrada do Matondelo para criar um estudo corporativo completo.</p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

      </div>
    </div>
  );
}
