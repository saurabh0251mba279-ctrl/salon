import type {
  AiInsight,
  AppointmentRecord,
  BusinessProfile,
  FollowUpRule,
  LeadRecord,
  WhatsAppAiResponsePayload,
  WorkspaceState,
} from '../types/locallift';

export interface BusinessPresetSummary {
  id: string;
  name: string;
  category: string;
  city: string;
}

async function handleJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchWorkspace(): Promise<{
  state: WorkspaceState;
  presets: BusinessPresetSummary[];
}> {
  const res = await fetch('/api/state');
  return handleJson(res);
}

export async function resetWorkspace(presetId: string): Promise<{ state: WorkspaceState }> {
  const res = await fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetId }),
  });
  return handleJson(res);
}

export async function sendWhatsAppSimulatorMessage(payload: {
  enquiryId?: string;
  customerName: string;
  customerPhone: string;
  message: string;
  afterHours?: boolean;
}): Promise<WhatsAppAiResponsePayload> {
  const res = await fetch('/api/chat/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function sendOwnerEnquiryReply(
  enquiryId: string,
  text: string
): Promise<{ state: WorkspaceState }> {
  const res = await fetch(`/api/enquiries/${enquiryId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return handleJson(res);
}

export async function updateEnquiry(
  enquiryId: string,
  patch: { unread?: boolean; status?: string }
): Promise<{ state: WorkspaceState }> {
  const res = await fetch(`/api/enquiries/${enquiryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handleJson(res);
}

export async function createAppointment(
  payload: Partial<AppointmentRecord>
): Promise<{ state: WorkspaceState; appointment: AppointmentRecord }> {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function updateAppointment(
  id: string,
  patch: Partial<AppointmentRecord>
): Promise<{ state: WorkspaceState }> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handleJson(res);
}

export async function deleteAppointment(id: string): Promise<{ state: WorkspaceState }> {
  const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
  return handleJson(res);
}

export async function createLead(
  payload: Partial<LeadRecord>
): Promise<{ state: WorkspaceState; lead: LeadRecord }> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function updateLead(
  id: string,
  patch: Partial<LeadRecord>
): Promise<{ state: WorkspaceState }> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handleJson(res);
}

export async function updateFollowUpRule(
  id: string,
  patch: Partial<FollowUpRule>
): Promise<{ state: WorkspaceState }> {
  const res = await fetch(`/api/followups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handleJson(res);
}

export async function draftAiFollowUp(payload: {
  customerName: string;
  serviceInterest: string;
  goal: string;
  notes?: string;
}): Promise<{ draft: string }> {
  const res = await fetch('/api/ai/draft-followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function sendFollowUpMessage(payload: {
  ruleName: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  leadId?: string;
  appointmentId?: string;
}): Promise<{ state: WorkspaceState }> {
  const res = await fetch('/api/followups/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function fetchAiInsights(): Promise<{ insights: AiInsight[] }> {
  const res = await fetch('/api/ai/insights', { method: 'POST' });
  return handleJson(res);
}

export async function saveBusinessProfile(
  profile: Partial<BusinessProfile>
): Promise<{ state: WorkspaceState }> {
  const res = await fetch('/api/business', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  return handleJson(res);
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`;
}
