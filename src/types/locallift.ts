export type NavTab =
  | 'overview'
  | 'simulator'
  | 'enquiries'
  | 'appointments'
  | 'leads'
  | 'followups'
  | 'analytics'
  | 'setup';

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMins: number;
  popular?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  ownerName: string;
  ownerRole: string;
  city: string;
  address: string;
  whatsappNumber: string;
  hours: string;
  closedDay: string;
  assistantName: string;
  tone: 'Warm & Boutique' | 'Crisp & Professional' | 'Friendly & Local';
  currencySymbol: string;
  bookingPolicy: string;
  afterHoursAutoReply: boolean;
  services: ServiceItem[];
  faqs: FaqItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'ai' | 'owner';
  text: string;
  timestamp: string;
  intentTag?: string;
}

export type EnquiryStatus = 'ai_handled' | 'needs_owner' | 'converted';

export interface EnquiryThread {
  id: string;
  customerName: string;
  customerPhone: string;
  source: 'WhatsApp Direct' | 'Instagram Click-to-WA' | 'Google Maps WA';
  status: EnquiryStatus;
  lastMessageAt: string;
  afterHours: boolean;
  intent: string;
  detectedService: string;
  estimatedValue: number;
  unread: boolean;
  messages: ChatMessage[];
}

export type LeadStage = 'new' | 'qualified' | 'booking_sent' | 'converted' | 'lost';

export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  serviceInterest: string;
  estimatedValue: number;
  stage: LeadStage;
  source: string;
  createdAt: string;
  lastContactedAt: string;
  nextFollowUpAt: string;
  notes: string;
  enquiryId?: string;
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface AppointmentRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  durationMins: number;
  stylist: string;
  status: AppointmentStatus;
  bookedVia: 'WhatsApp AI' | 'Manual';
  reminderSent: boolean;
  notes?: string;
}

export interface FollowUpRule {
  id: string;
  name: string;
  trigger: string;
  delayLabel: string;
  channel: 'WhatsApp';
  enabled: boolean;
  sentCount: number;
  replyRatePct: number;
  template: string;
}

export interface FollowUpLog {
  id: string;
  ruleName: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  sentAt: string;
  outcome: 'Sent' | 'Replied' | 'Booked';
}

export interface DailyMetric {
  day: string;
  enquiries: number;
  aiResolved: number;
  bookings: number;
  revenue: number;
}

export interface AiInsight {
  title: string;
  metric: string;
  action: string;
}

export interface WorkspaceState {
  business: BusinessProfile;
  enquiries: EnquiryThread[];
  leads: LeadRecord[];
  appointments: AppointmentRecord[];
  followUpRules: FollowUpRule[];
  followUpLogs: FollowUpLog[];
  dailyMetrics: DailyMetric[];
  avgResponseSeconds: number;
  lastUpdated: string;
}

export interface WhatsAppAiResponsePayload {
  state: WorkspaceState;
  enquiryId: string;
  aiMeta: {
    replyText: string;
    intent: string;
    detectedService: string;
    estimatedValue: number;
    leadStage: LeadStage;
    needsOwnerAttention: boolean;
    followUpSuggestion: string;
    bookingCreated?: AppointmentRecord | null;
  };
}
