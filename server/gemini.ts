import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type { AiInsight, BusinessProfile, ChatMessage, LeadStage, WorkspaceState } from '../src/types/locallift.ts';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please verify your API key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface WhatsAppAiStructuredResult {
  replyText: string;
  intent: string;
  detectedService: string;
  estimatedValue: number;
  leadStage: LeadStage;
  needsOwnerAttention: boolean;
  followUpSuggestion: string;
  bookingExtracted: {
    readyToBook: boolean;
    serviceName: string;
    preferredDate: string;
    preferredTime: string;
  };
}

export async function generateWhatsAppAssistantReply(params: {
  business: BusinessProfile;
  customerName: string;
  customerPhone: string;
  message: string;
  history: ChatMessage[];
  existingBookingsToday: string[];
}): Promise<WhatsAppAiStructuredResult> {
  const ai = getClient();
  const { business, customerName, message, history, existingBookingsToday } = params;

  const servicesText = business.services
    .map((s) => `- ${s.name} (${s.category}): ${business.currencySymbol}${s.price} | ${s.durationMins} mins`)
    .join('\n');

  const faqsText = business.faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');

  const historyText = history
    .slice(-10)
    .map((m) => `${m.sender === 'customer' ? customerName : business.assistantName}: ${m.text}`)
    .join('\n');

  const systemInstruction = `You are ${business.assistantName}, the AI WhatsApp customer assistant for "${business.name}" (${business.category}) in ${business.city}, powered by LocalLift AI.
Tone of voice: ${business.tone}.
Business Details:
- Owner: ${business.ownerName}
- Address: ${business.address}
- Working Hours: ${business.hours} (Closed: ${business.closedDay})
- Policy: ${business.bookingPolicy}
- Current reference date: 2026-11-19 (Thursday)

Service Menu & Prices:
${servicesText}

Frequently Asked Questions:
${faqsText}

Busy slots today (avoid double-booking): ${existingBookingsToday.join(', ') || 'None'}

Instructions:
1. Write a warm, concise, human-sounding WhatsApp reply (2–4 short sentences, no markdown tables or asterisks).
2. Always answer pricing, duration, or FAQ questions accurately using the Service Menu above.
3. Proactively guide enquiries toward booking a concrete date and time slot.
4. Only set bookingExtracted.readyToBook = true when the customer clearly confirms a service AND a specific date/day and time (e.g., "book me for Friday 3 PM", "confirm Saturday 11 AM"). Convert relative dates like "tomorrow" to YYYY-MM-DD based on 2026-11-19.
5. Set needsOwnerAttention = true ONLY if the request asks for special custom discounts, outside working hours opening, complaints, or bridal contract negotiations.
6. Return valid JSON matching the requested schema.`;

  const prompt = `Conversation so far:
${historyText || '(New conversation)'}

Latest WhatsApp message from ${customerName}:
"${message}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          replyText: {
            type: Type.STRING,
            description: 'The WhatsApp reply to send back to the customer.',
          },
          intent: {
            type: Type.STRING,
            description: 'Short 2-3 word label such as Price Enquiry, Appointment Booking, FAQ Question, Reschedule Request, Bridal Consultation.',
          },
          detectedService: {
            type: Type.STRING,
            description: 'Best matching service name from the menu, or General Enquiry.',
          },
          estimatedValue: {
            type: Type.NUMBER,
            description: 'Estimated booking value in local currency as a number.',
          },
          leadStage: {
            type: Type.STRING,
            description: 'One of: new, qualified, booking_sent, converted, lost.',
          },
          needsOwnerAttention: {
            type: Type.BOOLEAN,
            description: 'True only if owner manual intervention is needed.',
          },
          followUpSuggestion: {
            type: Type.STRING,
            description: 'Recommended automated follow-up timing and angle if customer does not reply.',
          },
          bookingExtracted: {
            type: Type.OBJECT,
            properties: {
              readyToBook: { type: Type.BOOLEAN },
              serviceName: { type: Type.STRING },
              preferredDate: { type: Type.STRING, description: 'YYYY-MM-DD format if readyToBook is true.' },
              preferredTime: { type: Type.STRING, description: 'e.g. 03:00 PM if readyToBook is true.' },
            },
            required: ['readyToBook', 'serviceName', 'preferredDate', 'preferredTime'],
          },
        },
        required: [
          'replyText',
          'intent',
          'detectedService',
          'estimatedValue',
          'leadStage',
          'needsOwnerAttention',
          'followUpSuggestion',
          'bookingExtracted',
        ],
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }
  const parsed = JSON.parse(rawText) as WhatsAppAiStructuredResult;
  const validStages: LeadStage[] = ['new', 'qualified', 'booking_sent', 'converted', 'lost'];
  if (!validStages.includes(parsed.leadStage)) {
    parsed.leadStage = 'qualified';
  }
  return parsed;
}

export async function generateFollowUpDraft(params: {
  business: BusinessProfile;
  customerName: string;
  serviceInterest: string;
  goal: string;
  notes?: string;
}): Promise<string> {
  const ai = getClient();
  const { business, customerName, serviceInterest, goal, notes } = params;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Draft a short, friendly WhatsApp follow-up message (max 55 words, plain text, no brackets or placeholders) from ${business.assistantName} at ${business.name} to customer ${customerName}.
Service interest: ${serviceInterest}
Goal: ${goal}
Context notes: ${notes || 'Recent WhatsApp enquiry'}
Tone: ${business.tone}. End with a simple one-word or quick reply prompt.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('Failed to generate follow-up message.');
  }
  return text;
}

export async function generateBusinessGrowthInsights(state: WorkspaceState): Promise<AiInsight[]> {
  const ai = getClient();

  const totalLeadsValue = state.leads.reduce((sum, l) => sum + l.estimatedValue, 0);
  const openPipeline = state.leads
    .filter((l) => l.stage !== 'converted' && l.stage !== 'lost')
    .map((l) => `${l.name} (${l.serviceInterest}, ${state.business.currencySymbol}${l.estimatedValue}, stage: ${l.stage})`);
  const afterHoursCount = state.enquiries.filter((e) => e.afterHours).length;
  const ownerEscalations = state.enquiries.filter((e) => e.status === 'needs_owner').length;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Analyze this local salon's live WhatsApp CRM metrics for "${state.business.name}" and return exactly 3 high-impact, concrete growth recommendations for the business owner.

Live Data:
- Active Enquiries: ${state.enquiries.length} (${afterHoursCount} captured after business hours, ${ownerEscalations} awaiting owner approval)
- Total Pipeline Value: ${state.business.currencySymbol}${totalLeadsValue}
- Open Leads: ${openPipeline.join('; ') || 'None'}
- Confirmed Appointments: ${state.appointments.filter((a) => a.status === 'confirmed').length}
- Active Follow-Up Automations: ${state.followUpRules.filter((r) => r.enabled).length} of ${state.followUpRules.length}

Be specific with rupee amounts, customer opportunities, and concrete actions. No generic buzzwords.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Concise 4-7 word insight title' },
            metric: { type: Type.STRING, description: 'Specific numeric callout e.g. ₹35,300 open high-ticket value' },
            action: { type: Type.STRING, description: 'One actionable sentence the owner can execute today' },
          },
          required: ['title', 'metric', 'action'],
        },
      },
    },
  });

  const rawText = (response.text ?? '[]').trim();
  return JSON.parse(rawText) as AiInsight[];
}
