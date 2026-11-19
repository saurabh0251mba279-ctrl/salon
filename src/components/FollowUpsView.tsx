import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import {
  draftAiFollowUp,
  sendFollowUpMessage,
  updateFollowUpRule,
} from '../lib/api';
import type { WorkspaceState } from '../types/locallift';

interface FollowUpsViewProps {
  state: WorkspaceState;
  onStateChange: (next: WorkspaceState) => void;
  onNotify: (msg: string) => void;
}

export function FollowUpsView({ state, onStateChange, onNotify }: FollowUpsViewProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState(state.leads[0]?.id ?? '');
  const [goal, setGoal] = useState('Recover unbooked enquiry with an open weekend slot');
  const [draftMessage, setDraftMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedLead = state.leads.find((l) => l.id === selectedLeadId) ?? state.leads[0];

  async function handleToggleRule(id: string, currentEnabled: boolean) {
    setTogglingId(id);
    try {
      const res = await updateFollowUpRule(id, { enabled: !currentEnabled });
      onStateChange(res.state);
      onNotify(`Automation ${!currentEnabled ? 'enabled' : 'paused'}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to update rule');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleGenerateDraft() {
    if (!selectedLead || generating) return;
    setGenerating(true);
    try {
      const res = await draftAiFollowUp({
        customerName: selectedLead.name,
        serviceInterest: selectedLead.serviceInterest,
        goal,
        notes: selectedLead.notes,
      });
      setDraftMessage(res.draft);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to generate AI follow-up');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendCustomFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !draftMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await sendFollowUpMessage({
        ruleName: 'AI Follow-Up Studio',
        recipientName: selectedLead.name,
        recipientPhone: selectedLead.phone,
        message: draftMessage.trim(),
        leadId: selectedLead.id,
      });
      onStateChange(res.state);
      setDraftMessage('');
      onNotify(`WhatsApp follow-up dispatched to ${selectedLead.name}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to dispatch follow-up');
    } finally {
      setSending(false);
    }
  }

  const totalSent = state.followUpRules.reduce((s, r) => s + r.sentCount, 0);
  const activeCount = state.followUpRules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Automated WhatsApp Follow-Ups</h1>
        <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
          {activeCount} of {state.followUpRules.length} sequences active · {totalSent} messages
          delivered automatically to prevent lead drop-off.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Automation Sequences */}
        <div className="lg:col-span-7 space-y-6">
          <section className="border border-slate-200 bg-white rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Scheduled Sequences</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle rules to control when {state.business.assistantName} reaches back out
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {state.followUpRules.map((rule) => (
                <div key={rule.id} className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{rule.name}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{rule.trigger}</p>
                      <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
                        {rule.delayLabel} · {rule.sentCount} sent · {rule.replyRatePct}% reply rate
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={rule.enabled}
                      disabled={togglingId === rule.id}
                      onClick={() => handleToggleRule(rule.id, rule.enabled)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        rule.enabled
                          ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                    {rule.template}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 5 cols: AI Composer + Recent Dispatch Log */}
        <div className="lg:col-span-5 space-y-6">
          <section className="border border-slate-200 bg-white rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-900">AI Follow-Up Composer</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate a personalized WhatsApp nudge for any lead in your pipeline
            </p>

            <form onSubmit={handleSendCustomFollowUp} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Customer
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {state.leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.serviceInterest} ({l.stage.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Follow-Up Objective
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Recover unbooked enquiry with an open weekend slot">
                    Recover unbooked enquiry with an open weekend slot
                  </option>
                  <option value="Offer complimentary consultation or bridal trial slot">
                    Offer complimentary consultation or bridal trial slot
                  </option>
                  <option value="Invite returning client for a 6-week maintenance refresh">
                    Invite returning client for a 6-week maintenance refresh
                  </option>
                  <option value="Request a quick Google review after a great salon visit">
                    Request a quick Google review after a great salon visit
                  </option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={generating || !selectedLead}
                  onClick={handleGenerateDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {generating ? 'Generating with Gemini...' : 'Generate AI Message'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp Message Preview
                </label>
                <textarea
                  rows={4}
                  required
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder="Click 'Generate AI Message' or write a custom WhatsApp follow-up..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={sending || !draftMessage.trim() || !selectedLead}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send WhatsApp Follow-Up'}
              </button>
            </form>
          </section>

          {/* Recent Dispatch History */}
          <section className="border border-slate-200 bg-white rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Recent Dispatches</h2>
            </div>
            <div className="divide-y divide-slate-200 max-h-[340px] overflow-y-auto">
              {state.followUpLogs.map((log) => (
                <div key={log.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{log.recipientName}</p>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {log.sentAt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{log.message}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    <span>{log.ruleName}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-medium text-emerald-700">{log.outcome}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
