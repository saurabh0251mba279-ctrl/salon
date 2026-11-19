import { useMemo, useState } from 'react';
import { Search, Send, Sparkles, UserPlus, X } from 'lucide-react';
import {
  createLead,
  draftAiFollowUp,
  formatCurrency,
  sendFollowUpMessage,
  updateLead,
} from '../lib/api';
import type { LeadRecord, LeadStage, WorkspaceState } from '../types/locallift';

interface LeadsViewProps {
  state: WorkspaceState;
  onStateChange: (next: WorkspaceState) => void;
  onNotify: (msg: string) => void;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  booking_sent: 'Booking Sent',
  converted: 'Converted',
  lost: 'Lost',
};

export function LeadsView({ state, onStateChange, onNotify }: LeadsViewProps) {
  const [stageFilter, setStageFilter] = useState<'all' | LeadStage>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [followUpLead, setFollowUpLead] = useState<LeadRecord | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // Add lead form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+91 ');
  const [newService, setNewService] = useState(state.business.services[0]?.name ?? '');
  const [newValue, setNewValue] = useState(String(state.business.services[0]?.price ?? 1500));
  const [newSource, setNewSource] = useState('WhatsApp Direct');
  const [newNotes, setNewNotes] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  const sym = state.business.currencySymbol;

  const filtered = useMemo(() => {
    return state.leads.filter((l) => {
      if (stageFilter !== 'all' && l.stage !== stageFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.serviceInterest.toLowerCase().includes(q) ||
          l.phone.includes(q)
        );
      }
      return true;
    });
  }, [state.leads, stageFilter, search]);

  const openValue = state.leads
    .filter((l) => l.stage !== 'converted' && l.stage !== 'lost')
    .reduce((s, l) => s + l.estimatedValue, 0);
  const wonValue = state.leads
    .filter((l) => l.stage === 'converted')
    .reduce((s, l) => s + l.estimatedValue, 0);
  const conversionPct = state.leads.length
    ? Math.round((state.leads.filter((l) => l.stage === 'converted').length / state.leads.length) * 100)
    : 0;

  async function handleStageChange(id: string, nextStage: LeadStage) {
    try {
      const res = await updateLead(id, { stage: nextStage });
      onStateChange(res.state);
      onNotify(`Lead moved to ${STAGE_LABELS[nextStage]}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update lead stage');
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setSavingLead(true);
    try {
      const res = await createLead({
        name: newName.trim(),
        phone: newPhone.trim(),
        serviceInterest: newService,
        estimatedValue: Number(newValue) || 1500,
        source: newSource,
        notes: newNotes.trim(),
        stage: 'new',
      });
      onStateChange(res.state);
      setShowAddModal(false);
      setNewName('');
      setNewPhone('+91 ');
      setNewNotes('');
      onNotify(`Lead ${res.lead.name} added to CRM`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Could not add lead');
    } finally {
      setSavingLead(false);
    }
  }

  async function openFollowUpModal(lead: LeadRecord) {
    setFollowUpLead(lead);
    setDraftText('');
    setDraftLoading(true);
    try {
      const res = await draftAiFollowUp({
        customerName: lead.name,
        serviceInterest: lead.serviceInterest,
        goal: 'Nudge customer warmly to confirm an appointment slot this week',
        notes: lead.notes,
      });
      setDraftText(res.draft);
    } catch (err) {
      setDraftText(
        `Hi ${lead.name}, checking in from ${state.business.name} regarding your ${lead.serviceInterest} enquiry. Would you like us to reserve a slot for you this week?`
      );
      onNotify(err instanceof Error ? err.message : 'AI draft unavailable; loaded standard draft');
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleDispatchFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpLead || !draftText.trim() || sendingFollowUp) return;
    setSendingFollowUp(true);
    try {
      const res = await sendFollowUpMessage({
        ruleName: 'Direct Lead Follow-Up',
        recipientName: followUpLead.name,
        recipientPhone: followUpLead.phone,
        message: draftText.trim(),
        leadId: followUpLead.id,
      });
      onStateChange(res.state);
      setFollowUpLead(null);
      onNotify(`WhatsApp follow-up sent to ${followUpLead.name}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to send follow-up');
    } finally {
      setSendingFollowUp(false);
    }
  }

  const stageTabs: { key: 'all' | LeadStage; label: string }[] = [
    { key: 'all', label: `All (${state.leads.length})` },
    { key: 'new', label: `New (${state.leads.filter((l) => l.stage === 'new').length})` },
    {
      key: 'qualified',
      label: `Qualified (${state.leads.filter((l) => l.stage === 'qualified').length})`,
    },
    {
      key: 'booking_sent',
      label: `Booking Sent (${state.leads.filter((l) => l.stage === 'booking_sent').length})`,
    },
    {
      key: 'converted',
      label: `Converted (${state.leads.filter((l) => l.stage === 'converted').length})`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lead Pipeline CRM</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Every WhatsApp prospect automatically captured, valued, and tracked until booking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Pipeline Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 border border-slate-200 bg-white rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Open Pipeline</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(openValue, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Unbooked enquiries in follow-up</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Converted Revenue</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {formatCurrency(wonValue, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Confirmed from WhatsApp leads</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Lead-to-Booking Rate</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {conversionPct}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {state.leads.length} tracked prospects</p>
        </div>
      </section>

      {/* Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
          {stageTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStageFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stageFilter === t.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead name or service..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="border border-slate-200 bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-5">Prospect</th>
                <th className="py-3 px-4">Service Interest</th>
                <th className="py-3 px-4 text-right">Est. Value</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4">Last Contacted</th>
                <th className="py-3 px-5 text-right">Follow-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    No leads in this stage yet.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs font-mono tabular-nums text-slate-500">
                        {lead.phone} · {lead.source}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-900 truncate">{lead.serviceInterest}</p>
                      <p className="text-xs text-slate-500 truncate">{lead.notes}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {formatCurrency(lead.estimatedValue, sym)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Stage for ${lead.name}`}
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                        className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                      >
                        {(Object.keys(STAGE_LABELS) as LeadStage[]).map((st) => (
                          <option key={st} value={st}>
                            {STAGE_LABELS[st]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      <p className="font-mono tabular-nums text-slate-800">{lead.lastContactedAt}</p>
                      <p className="text-slate-500 truncate max-w-[180px]">
                        Next: {lead.nextFollowUpAt}
                      </p>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openFollowUpModal(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Follow-Up
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Add New Lead</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Shreya Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    required
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Est. Value ({sym})
                  </label>
                  <input
                    required
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Service</label>
                  <select
                    value={newService}
                    onChange={(e) => {
                      setNewService(e.target.value);
                      const found = state.business.services.find((s) => s.name === e.target.value);
                      if (found) setNewValue(String(found.price));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {state.business.services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option>WhatsApp Direct</option>
                    <option>Instagram Click-to-WA</option>
                    <option>Google Maps WA</option>
                    <option>Walk-in Referral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Preferred day, event date, or hair/skin notes"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {savingLead ? 'Saving...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Follow-Up Modal */}
      {followUpLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  AI WhatsApp Follow-Up · {followUpLead.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {followUpLead.serviceInterest} · {followUpLead.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFollowUpLead(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDispatchFollowUp} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Personalized Message Draft
                </label>
                {draftLoading ? (
                  <div className="h-28 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 animate-pulse">
                    Drafting tailored WhatsApp follow-up with Gemini AI...
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    required
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFollowUpLead(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={draftLoading || sendingFollowUp || !draftText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingFollowUp ? 'Sending...' : 'Send on WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
