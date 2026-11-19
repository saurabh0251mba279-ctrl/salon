import { useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  MessageSquare,
  RefreshCw,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchAiInsights, formatCurrency, sendFollowUpMessage } from '../lib/api';
import type { AiInsight, NavTab, WorkspaceState } from '../types/locallift';

const STUDIO_BANNER_SRC = '/src/assets/images/salon_studio_banner_1795108298517.jpg';
const OWNER_AVATAR_SRC = '/src/assets/images/salon_owner_avatar_1795108297988.jpg';

interface OverviewViewProps {
  state: WorkspaceState;
  onNavigate: (tab: NavTab) => void;
  onStateChange: (next: WorkspaceState) => void;
  onNotify: (msg: string) => void;
}

export function OverviewView({
  state,
  onNavigate,
  onStateChange,
  onNotify,
}: OverviewViewProps) {
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const sym = state.business.currencySymbol;
  const totalEnquiries7d = state.dailyMetrics.reduce((s, d) => s + d.enquiries, 0);
  const aiResolved7d = state.dailyMetrics.reduce((s, d) => s + d.aiResolved, 0);
  const totalBookings7d = state.dailyMetrics.reduce((s, d) => s + d.bookings, 0);
  const totalRevenue7d = state.dailyMetrics.reduce((s, d) => s + d.revenue, 0);
  const resolutionRate = totalEnquiries7d
    ? Math.round((aiResolved7d / totalEnquiries7d) * 100)
    : 0;
  const conversionRate = totalEnquiries7d
    ? Math.round((totalBookings7d / totalEnquiries7d) * 100)
    : 0;

  const ownerEscalations = state.enquiries.filter((e) => e.status === 'needs_owner');
  const upcomingAppointments = state.appointments
    .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
    .slice(0, 4);

  async function handleGenerateInsights() {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await fetchAiInsights();
      setInsights(res.insights);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Unable to fetch AI insights.');
    } finally {
      setLoadingInsights(false);
    }
  }

  async function handleQuickReminder(aptId: string, name: string, phone: string, service: string, time: string) {
    setRemindingId(aptId);
    try {
      const msg = `Hi ${name}, quick reminder from ${state.business.name} for your ${service} at ${time}. Reply here if you need any changes.`;
      const res = await sendFollowUpMessage({
        ruleName: 'Same-Day Appointment Reminder',
        recipientName: name,
        recipientPhone: phone,
        message: msg,
        appointmentId: aptId,
      });
      onStateChange(res.state);
      onNotify(`WhatsApp reminder sent to ${name}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Studio Hero Strip */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 bg-white rounded-xl overflow-hidden items-stretch">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-6">
          <div>
            <p className="text-xs font-medium text-emerald-700 tracking-wide">
              WhatsApp Business Assistant · {state.business.city}
            </p>
            <h1 className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Never miss a customer enquiry, even when every chair is full.
            </h1>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed max-w-xl">
              {state.business.assistantName} responds to WhatsApp enquiries for{' '}
              <span className="font-medium text-slate-900">{state.business.name}</span> in under{' '}
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {state.avgResponseSeconds}s
              </span>
              , quotes accurate service prices, captures leads, and confirms bookings automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-3">
              {!avatarError ? (
                <img
                  src={OWNER_AVATAR_SRC}
                  alt={state.business.ownerName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-semibold text-emerald-800 shrink-0">
                  {state.business.ownerName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">{state.business.ownerName}</p>
                <p className="text-xs text-slate-500">
                  {state.business.ownerRole} · {state.business.hours}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Test Live AI Chat
              </button>
              <button
                type="button"
                onClick={() => onNavigate('setup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Edit Menu & FAQs
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[220px] bg-slate-100">
          {!bannerError ? (
            <img
              src={STUDIO_BANNER_SRC}
              alt={`${state.business.name} interior`}
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-emerald-950 flex items-center justify-center p-6 text-white">
              <div className="text-center">
                <p className="text-lg font-semibold">{state.business.name}</p>
                <p className="text-xs text-slate-300 mt-1">{state.business.category}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent flex flex-col justify-end p-5 text-white">
            <p className="text-xs text-slate-200">Connected WhatsApp Business</p>
            <p className="text-base font-semibold tracking-tight mt-0.5">{state.business.name}</p>
            <p className="text-xs font-mono tabular-nums text-slate-200 mt-0.5">
              {state.business.whatsappNumber} · {state.business.services.length} Services Indexed
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip — flat surface with vertical dividers */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Enquiries Handled (7d)</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalEnquiries7d}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium tabular-nums">
            {resolutionRate}% resolved autonomously by AI
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Appointments Booked (7d)</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalBookings7d}
          </p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            {conversionRate}% enquiry-to-booking conversion
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Revenue Attributed (7d)</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(totalRevenue7d, sym)}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium tabular-nums">
            {formatCurrency(
              state.leads
                .filter((l) => l.stage !== 'converted' && l.stage !== 'lost')
                .reduce((s, l) => s + l.estimatedValue, 0),
              sym
            )}{' '}
            active open pipeline
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Avg WhatsApp Response</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {state.avgResponseSeconds} sec
          </p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            {state.enquiries.filter((e) => e.afterHours).length} after-hours leads saved
          </p>
        </div>
      </section>

      {/* Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Trend Chart + Recent Enquiries */}
        <div className="lg:col-span-7 space-y-6">
          <section className="border border-slate-200 bg-white rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Enquiries vs. Confirmed Bookings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rolling 7-day WhatsApp conversion velocity
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Full Analytics <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={state.dailyMetrics}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="enquiries"
                    name="WhatsApp Enquiries"
                    stroke="#0f766e"
                    strokeWidth={2}
                    fill="#ccfbf1"
                    fillOpacity={0.55}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="Confirmed Bookings"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="#d1fae5"
                    fillOpacity={0.7}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="border border-slate-200 bg-white rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Recent WhatsApp Conversations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live threads handled by {state.business.assistantName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('enquiries')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Inbox <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {state.enquiries.slice(0, 4).map((enq) => {
                const lastMsg = enq.messages[enq.messages.length - 1];
                const statusLabel =
                  enq.status === 'converted'
                    ? 'Booked'
                    : enq.status === 'needs_owner'
                    ? 'Needs Owner'
                    : 'AI Handled';
                const statusColor =
                  enq.status === 'converted'
                    ? 'text-emerald-700'
                    : enq.status === 'needs_owner'
                    ? 'text-amber-700'
                    : 'text-slate-600';

                return (
                  <button
                    key={enq.id}
                    type="button"
                    onClick={() => onNavigate('enquiries')}
                    className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer block"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {enq.customerName}
                      </p>
                      <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap shrink-0">
                        {enq.lastMessageAt}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 truncate">
                      {lastMsg?.text ?? 'No messages yet'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{enq.detectedService}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {formatCurrency(enq.estimatedValue, sym)}
                      </span>
                      {enq.afterHours && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-700">After-Hours Capture</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right 5 cols: Escalations + Upcoming Appointments + Live Gemini Insights */}
        <div className="lg:col-span-5 space-y-6">
          {ownerEscalations.length > 0 && (
            <section className="border border-amber-200 bg-amber-50/50 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Requires Owner Review ({ownerEscalations.length})
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Custom requests escalated by {state.business.assistantName}
                  </p>
                </div>
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              </div>
              <div className="mt-4 divide-y divide-amber-200/70">
                {ownerEscalations.map((esc) => (
                  <div key={esc.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{esc.customerName}</p>
                      <span className="text-xs font-mono tabular-nums font-medium text-slate-900">
                        {formatCurrency(esc.estimatedValue, sym)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {esc.messages[0]?.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('enquiries')}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
                    >
                      Reply as Owner <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Schedule */}
          <section className="border border-slate-200 bg-white rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Upcoming Bookings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirmed slots synced from WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('appointments')}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                View All
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="p-6 text-center">
                <CalendarCheck className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm text-slate-600">No upcoming bookings scheduled.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('appointments')}
                  className="mt-3 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  Create First Booking
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {apt.customerName}
                      </p>
                      <p className="text-xs text-slate-600 truncate">{apt.serviceName}</p>
                      <p className="mt-1 text-xs font-mono tabular-nums text-slate-500">
                        {apt.date} · {apt.time} · {formatCurrency(apt.price, sym)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {apt.reminderSent ? (
                        <span className="text-xs font-medium text-emerald-700">Reminder Sent</span>
                      ) : (
                        <button
                          type="button"
                          disabled={remindingId === apt.id}
                          onClick={() =>
                            handleQuickReminder(
                              apt.id,
                              apt.customerName,
                              apt.customerPhone,
                              apt.serviceName,
                              apt.time
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          {remindingId === apt.id ? 'Sending...' : 'Remind'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* On-Demand Gemini Growth Brief */}
          <section className="border border-slate-200 bg-white rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">AI Revenue Brief</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyzes your open leads and salon bookings
                </p>
              </div>
              <button
                type="button"
                disabled={loadingInsights}
                onClick={handleGenerateInsights}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                {loadingInsights ? 'Analyzing...' : insights.length ? 'Refresh' : 'Generate Brief'}
              </button>
            </div>

            {insightsError && (
              <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {insightsError}
              </p>
            )}

            {insights.length === 0 && !loadingInsights && !insightsError && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <p>
                  Click <span className="font-medium text-slate-900">Generate Brief</span> to get 3
                  concrete revenue recovery actions from your live WhatsApp enquiries.
                </p>
              </div>
            )}

            {loadingInsights && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="animate-pulse space-y-1.5">
                    <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {insights.length > 0 && !loadingInsights && (
              <div className="mt-4 pt-3 border-t border-slate-200 divide-y divide-slate-200">
                {insights.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-1 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <span className="text-xs font-mono tabular-nums text-emerald-700 shrink-0">
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.action}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
