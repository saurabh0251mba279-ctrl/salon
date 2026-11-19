import { useMemo, useState } from 'react';
import { CalendarPlus, Search, Send, Sparkles } from 'lucide-react';
import {
  createAppointment,
  draftAiFollowUp,
  formatCurrency,
  sendOwnerEnquiryReply,
  updateEnquiry,
} from '../lib/api';
import type { EnquiryStatus, WorkspaceState } from '../types/locallift';

interface EnquiriesViewProps {
  state: WorkspaceState;
  onStateChange: (next: WorkspaceState) => void;
  onNotify: (msg: string) => void;
}

export function EnquiriesView({ state, onStateChange, onNotify }: EnquiriesViewProps) {
  const [filter, setFilter] = useState<'all' | EnquiryStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(state.enquiries[0]?.id ?? '');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [draftingAi, setDraftingAi] = useState(false);
  const [converting, setConverting] = useState(false);

  const sym = state.business.currencySymbol;

  const filtered = useMemo(() => {
    return state.enquiries.filter((e) => {
      if (filter !== 'all' && e.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.customerName.toLowerCase().includes(q) ||
          e.detectedService.toLowerCase().includes(q) ||
          e.customerPhone.includes(q)
        );
      }
      return true;
    });
  }, [state.enquiries, filter, search]);

  const activeThread =
    filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  async function handleSelectThread(id: string, unread: boolean) {
    setSelectedId(id);
    if (unread) {
      try {
        const res = await updateEnquiry(id, { unread: false });
        onStateChange(res.state);
      } catch {
        // Ignore silent read-receipt error
      }
    }
  }

  async function handleSendOwnerReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await sendOwnerEnquiryReply(activeThread.id, replyText.trim());
      onStateChange(res.state);
      setReplyText('');
      onNotify(`Owner reply sent to ${activeThread.customerName}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setSending(false);
    }
  }

  async function handleAiDraft() {
    if (!activeThread || draftingAi) return;
    setDraftingAi(true);
    try {
      const res = await draftAiFollowUp({
        customerName: activeThread.customerName,
        serviceInterest: activeThread.detectedService,
        goal:
          activeThread.status === 'needs_owner'
            ? 'Respond warmly as the salon owner to confirm availability and offer a helpful next step'
            : 'Follow up politely and confirm an appointment slot',
        notes: activeThread.messages[activeThread.messages.length - 1]?.text,
      });
      setReplyText(res.draft);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to draft AI reply');
    } finally {
      setDraftingAi(false);
    }
  }

  async function handleQuickConvertToBooking() {
    if (!activeThread || converting) return;
    setConverting(true);
    try {
      await createAppointment({
        customerName: activeThread.customerName,
        customerPhone: activeThread.customerPhone,
        serviceName: activeThread.detectedService,
        price: activeThread.estimatedValue,
        date: '2026-11-20',
        time: '04:00 PM',
        bookedVia: 'WhatsApp AI',
        status: 'confirmed',
        notes: `Converted directly from WhatsApp enquiry (${activeThread.intent}).`,
      });
      const updated = await updateEnquiry(activeThread.id, { status: 'converted', unread: false });
      onStateChange(updated.state);
      onNotify(`Converted ${activeThread.customerName} into a confirmed appointment`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to convert enquiry');
    } finally {
      setConverting(false);
    }
  }

  const filterOptions: { key: 'all' | EnquiryStatus; label: string }[] = [
    { key: 'all', label: `All (${state.enquiries.length})` },
    {
      key: 'needs_owner',
      label: `Needs Owner (${state.enquiries.filter((e) => e.status === 'needs_owner').length})`,
    },
    {
      key: 'ai_handled',
      label: `AI Handled (${state.enquiries.filter((e) => e.status === 'ai_handled').length})`,
    },
    {
      key: 'converted',
      label: `Booked (${state.enquiries.filter((e) => e.status === 'converted').length})`,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">WhatsApp Enquiry Inbox</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Review AI-handled conversations, step in as owner when needed, or convert leads into
            bookings.
          </p>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === opt.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master-Detail Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 bg-white rounded-xl overflow-hidden min-h-[580px]">
        {/* Left List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or service..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-200 overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No enquiries match this filter.
              </div>
            ) : (
              filtered.map((enq) => {
                const isSelected = activeThread?.id === enq.id;
                const statusText =
                  enq.status === 'converted'
                    ? 'Booked'
                    : enq.status === 'needs_owner'
                    ? 'Needs Owner'
                    : 'AI Handled';
                const statusTone =
                  enq.status === 'converted'
                    ? 'text-emerald-700'
                    : enq.status === 'needs_owner'
                    ? 'text-amber-700'
                    : 'text-slate-500';

                return (
                  <button
                    key={enq.id}
                    type="button"
                    onClick={() => handleSelectThread(enq.id, enq.unread)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer block ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          enq.unread ? 'font-bold text-slate-950' : 'font-semibold text-slate-900'
                        }`}
                      >
                        {enq.customerName}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                        {enq.lastMessageAt}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 truncate">
                      {enq.messages[enq.messages.length - 1]?.text}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className={`font-medium ${statusTone}`}>{statusText}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{enq.detectedService}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-700 shrink-0">
                        {formatCurrency(enq.estimatedValue, sym)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-8 flex flex-col">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-slate-500">
              Select a WhatsApp conversation to view details.
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {activeThread.customerName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                    {activeThread.customerPhone} · {activeThread.source} ·{' '}
                    {activeThread.detectedService} ({formatCurrency(activeThread.estimatedValue, sym)})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeThread.status !== 'converted' && (
                    <button
                      type="button"
                      disabled={converting}
                      onClick={handleQuickConvertToBooking}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      {converting ? 'Booking...' : 'Convert to Booking'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-6 bg-slate-50/70 overflow-y-auto space-y-3.5 max-h-[390px]">
                {activeThread.messages.map((m) => {
                  const isCustomer = m.sender === 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                          isCustomer
                            ? 'bg-white border border-slate-200 text-slate-900'
                            : m.sender === 'owner'
                            ? 'bg-slate-900 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        <p
                          className={`text-[11px] font-medium mb-1 ${
                            isCustomer ? 'text-slate-500' : 'text-emerald-100'
                          }`}
                        >
                          {isCustomer
                            ? activeThread.customerName
                            : m.sender === 'owner'
                            ? `${state.business.ownerName} (Owner)`
                            : `${state.business.assistantName} (LocalLift AI)`}
                        </p>
                        <p className="leading-relaxed">{m.text}</p>
                        <p
                          className={`mt-1.5 text-[11px] font-mono tabular-nums text-right ${
                            isCustomer ? 'text-slate-400' : 'text-emerald-100/80'
                          }`}
                        >
                          {m.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleSendOwnerReply}
                className="p-4 border-t border-slate-200 bg-white space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Reply directly as {state.business.ownerName}
                  </span>
                  <button
                    type="button"
                    disabled={draftingAi}
                    onClick={handleAiDraft}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {draftingAi ? 'Drafting with AI...' : 'Draft Smart Reply'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a WhatsApp message to this customer..."
                    className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Send Reply
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
