import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  CheckCheck,
  Moon,
  Plus,
  Send,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, sendWhatsAppSimulatorMessage } from '../lib/api';
import type { NavTab, WhatsAppAiResponsePayload, WorkspaceState } from '../types/locallift';

interface WhatsAppSimulatorViewProps {
  state: WorkspaceState;
  onStateChange: (next: WorkspaceState) => void;
  onNavigate: (tab: NavTab) => void;
  onNotify: (msg: string) => void;
}

export function WhatsAppSimulatorView({
  state,
  onStateChange,
  onNavigate,
  onNotify,
}: WhatsAppSimulatorViewProps) {
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(
    state.enquiries[0]?.id ?? null
  );
  const [customerName, setCustomerName] = useState('Rhea Kapoor');
  const [customerPhone, setCustomerPhone] = useState('+91 98455 31029');
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(true);
  const [afterHoursMode, setAfterHoursMode] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAiMeta, setLastAiMeta] = useState<WhatsAppAiResponsePayload['aiMeta'] | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeThread = !isNewCustomerMode
    ? state.enquiries.find((e) => e.id === selectedEnquiryId) ?? null
    : null;

  const displayedMessages = activeThread ? activeThread.messages : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages.length, sending]);

  const primaryService = state.business.services[0]?.name ?? 'Signature Haircut & Blowdry';
  const secondaryService = state.business.services[1]?.name ?? 'Keratin Smooth Therapy';
  const bridalService =
    state.business.services.find((s) => s.category.toLowerCase().includes('bridal'))?.name ??
    state.business.services[state.business.services.length - 1]?.name ??
    'Bridal Package';

  const quickScenarios = [
    {
      label: 'Ask price & open slots',
      prompt: `Hi! How much is ${secondaryService} and do you have any slots tomorrow afternoon?`,
    },
    {
      label: 'Confirm booking directly',
      prompt: `Please book me for ${primaryService} tomorrow (2026-11-20) at 3:00 PM.`,
    },
    {
      label: 'Ask salon FAQ',
      prompt: `Do you accept walk-ins on weekends and is parking available near ${state.business.name}?`,
    },
    {
      label: 'Escalate custom group request',
      prompt: `We need ${bridalService} for a group of 5 early Sunday morning at 6:30 AM. Can we get a custom discount?`,
    },
  ];

  async function handleSend(textOverride?: string) {
    const textToSend = (textOverride ?? draftMessage).trim();
    if (!textToSend || sending) return;

    setSending(true);
    setErrorMsg(null);
    if (!textOverride) setDraftMessage('');

    try {
      const payload = await sendWhatsAppSimulatorMessage({
        enquiryId: activeThread?.id,
        customerName: activeThread ? activeThread.customerName : customerName,
        customerPhone: activeThread ? activeThread.customerPhone : customerPhone,
        message: textToSend,
        afterHours: afterHoursMode,
      });
      onStateChange(payload.state);
      setIsNewCustomerMode(false);
      setSelectedEnquiryId(payload.enquiryId);
      setLastAiMeta(payload.aiMeta);

      if (payload.aiMeta.bookingCreated) {
        onNotify(
          `Auto-booked ${payload.aiMeta.bookingCreated.serviceName} for ${payload.aiMeta.bookingCreated.date} at ${payload.aiMeta.bookingCreated.time}`
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to reach Gemini AI assistant.'
      );
    } finally {
      setSending(false);
    }
  }

  function startFreshCustomer() {
    setIsNewCustomerMode(true);
    setSelectedEnquiryId(null);
    setLastAiMeta(null);
    setErrorMsg(null);
    const randomSuffix = Math.floor(10000 + Math.random() * 89999);
    setCustomerName('Anjali Deshpande');
    setCustomerPhone(`+91 98450 ${randomSuffix}`);
  }

  const sym = state.business.currencySymbol;

  return (
    <div className="space-y-6">
      {/* Header Explanation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Live WhatsApp AI Simulator</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Message <span className="font-medium text-slate-900">{state.business.name}</span> as a
            customer to watch {state.business.assistantName} answer FAQs, capture leads, and book
            appointments in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAfterHoursMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              afterHoursMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            {afterHoursMode ? 'After-Hours Mode (11:15 PM)' : 'Simulate 11:15 PM Mode'}
          </button>
          <button
            type="button"
            onClick={startFreshCustomer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Customer Chat
          </button>
        </div>
      </div>

      {/* Main 12-Col Simulator Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 cols: Interactive WhatsApp Client */}
        <div className="lg:col-span-7 border border-slate-200 bg-white rounded-xl overflow-hidden flex flex-col min-h-[620px]">
          {/* Customer Persona Bar */}
          <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                {(activeThread?.customerName ?? customerName).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {state.business.name} · AI Assistant ({state.business.assistantName})
                </p>
                <p className="text-xs text-slate-300 truncate">
                  Simulating customer: {activeThread?.customerName ?? customerName} (
                  {activeThread?.customerPhone ?? customerPhone})
                </p>
              </div>
            </div>

            <select
              aria-label="Select conversation"
              value={isNewCustomerMode ? '__new__' : selectedEnquiryId ?? '__new__'}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  startFreshCustomer();
                } else {
                  setIsNewCustomerMode(false);
                  setSelectedEnquiryId(e.target.value);
                  setLastAiMeta(null);
                  setErrorMsg(null);
                }
              }}
              className="text-xs bg-slate-800 border border-slate-700 text-white rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="__new__">+ New Walk-in Customer</option>
              {state.enquiries.map((enq) => (
                <option key={enq.id} value={enq.id}>
                  {enq.customerName} ({enq.detectedService})
                </option>
              ))}
            </select>
          </div>

          {/* Editable new customer fields when starting a brand-new simulation */}
          {isNewCustomerMode && (
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Simulated Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Customer WhatsApp Number
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Chat Canvas */}
          <div className="flex-1 p-5 bg-[#efeae2]/60 overflow-y-auto space-y-3 max-h-[420px]">
            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
                <p className="text-sm font-semibold text-slate-800">
                  Start a WhatsApp enquiry with {state.business.name}
                </p>
                <p className="text-xs text-slate-600 mt-1 max-w-sm">
                  Type any question about prices, timings, or booking below — or pick one of the
                  quick customer prompts.
                </p>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm shadow-xs ${
                        isCustomer
                          ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      {!isCustomer && (
                        <p className="text-[11px] font-semibold text-emerald-800 mb-1">
                          {msg.sender === 'owner'
                            ? `${state.business.ownerName} (Owner)`
                            : `${state.business.assistantName} · LocalLift AI`}
                        </p>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                        {msg.intentTag && (
                          <>
                            <span className="font-sans text-slate-500">{msg.intentTag}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{msg.timestamp}</span>
                        {isCustomer && <CheckCheck className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-4 py-3 text-xs text-slate-600">
                  {state.business.assistantName} is checking {state.business.name} menu & schedule...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Demo Scenarios */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
            <p className="text-[11px] font-medium text-slate-500 mb-2">
              Quick Demo Customer Prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickScenarios.map((sc) => (
                <button
                  key={sc.label}
                  type="button"
                  disabled={sending}
                  onClick={() => handleSend(sc.prompt)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-800 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="font-semibold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Type a WhatsApp message as a salon customer..."
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={sending || !draftMessage.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>

        {/* Right 5 cols: Real-Time AI Extraction & Automation Panel */}
        <div className="lg:col-span-5 border border-slate-200 bg-white rounded-xl p-6 flex flex-col justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Real-Time AI CRM & Booking Sync
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Every WhatsApp message is parsed to update your Lead Pipeline, Appointments, and
              Follow-Up queue automatically.
            </p>

            {lastAiMeta ? (
              <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">Detected Intent</span>
                  <span className="text-sm font-semibold text-slate-900">{lastAiMeta.intent}</span>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">Matched Service</span>
                  <span className="text-sm font-medium text-slate-900 text-right">
                    {lastAiMeta.detectedService}
                  </span>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">Estimated Deal Value</span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-emerald-700">
                    {formatCurrency(lastAiMeta.estimatedValue, sym)}
                  </span>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">CRM Pipeline Stage</span>
                  <span className="text-sm font-medium text-slate-900 capitalize">
                    {lastAiMeta.leadStage.replace('_', ' ')}
                  </span>
                </div>
                <div className="py-3.5">
                  <span className="text-xs text-slate-500 block">Automated Follow-Up Plan</span>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                    {lastAiMeta.followUpSuggestion}
                  </p>
                </div>

                {lastAiMeta.needsOwnerAttention && (
                  <div className="py-3.5">
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-900">
                          Escalated to Owner Inbox
                        </p>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Flagged for {state.business.ownerName} because it requires custom approval
                          or special timing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {lastAiMeta.bookingCreated && (
                  <div className="py-3.5">
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                        <CalendarCheck className="w-4 h-4" />
                        Appointment Automatically Booked
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900">
                        {lastAiMeta.bookingCreated.serviceName}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-slate-700 mt-0.5">
                        {lastAiMeta.bookingCreated.date} · {lastAiMeta.bookingCreated.time} ·{' '}
                        {formatCurrency(lastAiMeta.bookingCreated.price, sym)}
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('appointments')}
                        className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      >
                        View in Appointments <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 pt-5 border-t border-slate-200 space-y-4">
                <div className="flex items-start gap-3">
                  <UserPlus className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Zero-Leak Lead Capture</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Every new WhatsApp message creates or updates a CRM lead with service
                      interest and rupee value.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Conversational Booking</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      When a customer confirms a date and time, LocalLift writes the slot directly
                      into your Appointments schedule.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Smart Owner Handover</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Custom discounts, complaints, or early-hour group requests are escalated to{' '}
                      {state.business.ownerName} automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Indexed Knowledge Summary */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Knowledge Base: {state.business.services.length} services ·{' '}
              {state.business.faqs.length} FAQs
            </span>
            <button
              type="button"
              onClick={() => onNavigate('leads')}
              className="font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap cursor-pointer"
            >
              Inspect CRM Leads →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
