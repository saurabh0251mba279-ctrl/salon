import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../lib/api';
import type { WorkspaceState } from '../types/locallift';

interface AnalyticsViewProps {
  state: WorkspaceState;
}

export function AnalyticsView({ state }: AnalyticsViewProps) {
  // Interactive Business Impact & ROI Calculator (MBA Pitch & Owner Demo)
  const [monthlyEnquiries, setMonthlyEnquiries] = useState(240);
  const [missedRatePct, setMissedRatePct] = useState(32);
  const [avgTicket, setAvgTicket] = useState(2200);
  const [recoveryRatePct, setRecoveryRatePct] = useState(45);

  const sym = state.business.currencySymbol;
  const saasMonthlyFee = 1999;

  const missedEnquiriesPerMonth = Math.round((monthlyEnquiries * missedRatePct) / 100);
  const recoveredBookings = Math.round((missedEnquiriesPerMonth * recoveryRatePct) / 100);
  const extraMonthlyRevenue = recoveredBookings * avgTicket;
  const netMonthlyGain = extraMonthlyRevenue - saasMonthlyFee;
  const roiMultiple = (extraMonthlyRevenue / saasMonthlyFee).toFixed(1);

  const totalEnq = state.dailyMetrics.reduce((s, d) => s + d.enquiries, 0);
  const totalAiResolved = state.dailyMetrics.reduce((s, d) => s + d.aiResolved, 0);
  const totalBookings = state.dailyMetrics.reduce((s, d) => s + d.bookings, 0);
  const totalRevenue = state.dailyMetrics.reduce((s, d) => s + d.revenue, 0);

  // Compute service demand distribution from appointments + leads
  const serviceDemand = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; value: number }>();
    for (const apt of state.appointments) {
      const existing = counts.get(apt.serviceName) ?? {
        name: apt.serviceName,
        count: 0,
        value: 0,
      };
      existing.count += 1;
      existing.value += apt.price;
      counts.set(apt.serviceName, existing);
    }
    for (const lead of state.leads) {
      const existing = counts.get(lead.serviceInterest) ?? {
        name: lead.serviceInterest,
        count: 0,
        value: 0,
      };
      existing.count += 1;
      existing.value += lead.estimatedValue;
      counts.set(lead.serviceInterest, existing);
    }
    return Array.from(counts.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [state.appointments, state.leads]);

  const funnelSteps = [
    { label: 'Total WhatsApp Enquiries', count: totalEnq, pct: 100 },
    {
      label: 'Answered in <10 Seconds by AI',
      count: totalAiResolved,
      pct: totalEnq ? Math.round((totalAiResolved / totalEnq) * 100) : 0,
    },
    {
      label: 'Qualified & Slot Offered',
      count: Math.round(totalAiResolved * 0.76),
      pct: totalEnq ? Math.round(((totalAiResolved * 0.76) / totalEnq) * 100) : 0,
    },
    {
      label: 'Confirmed Appointments',
      count: totalBookings,
      pct: totalEnq ? Math.round((totalBookings / totalEnq) * 100) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Conversion Analytics & ROI</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Track WhatsApp revenue attribution, funnel drop-off recovery, and projected monthly ROI.
        </p>
      </div>

      {/* Top 4-Col Analytics KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">7-Day Attributed Revenue</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(totalRevenue, sym)}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">
            Annualized run-rate {formatCurrency(totalRevenue * 52, sym)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">AI Containment Rate</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalEnq ? Math.round((totalAiResolved / totalEnq) * 100) : 0}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Handled without interrupting stylists</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Avg Booking Ticket</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(totalBookings ? totalRevenue / totalBookings : 0, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {totalBookings} confirmed visits</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Owner Hours Saved (7d)</p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {(totalAiResolved * 0.08).toFixed(1)} hrs
          </p>
          <p className="mt-1 text-xs text-slate-500">Est. 5 mins manual reply per enquiry</p>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 border border-slate-200 bg-white rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900">Daily Booking Revenue ({sym})</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">
            Direct revenue from WhatsApp AI bookings over the past 7 days
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={state.dailyMetrics}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
                  tickFormatter={(v: number) => `${sym}${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value), sym), 'Booked Revenue']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Conversion Funnel */}
        <section className="lg:col-span-5 border border-slate-200 bg-white rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Enquiry-to-Booking Funnel</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How WhatsApp chats convert into confirmed chairs
            </p>

            <div className="mt-6 space-y-4">
              {funnelSteps.map((step) => (
                <div key={step.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{step.label}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {step.count} ({step.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 rounded-full transition-all"
                      style={{ width: `${Math.max(step.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Top Services by Demand</h3>
            <div className="space-y-2">
              {serviceDemand.slice(0, 3).map((srv) => (
                <div
                  key={srv.name}
                  className="flex items-center justify-between text-xs text-slate-600"
                >
                  <span className="truncate pr-3">{srv.name}</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900 shrink-0">
                    {formatCurrency(srv.value, sym)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Interactive Local Business ROI & SaaS Unit Economics Simulator */}
      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Salon Revenue Recovery & SaaS ROI Calculator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Model how LocalLift AI pays for itself by capturing missed and after-hours WhatsApp
              enquiries
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            Growth Plan Reference: {formatCurrency(saasMonthlyFee, sym)}/month
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-700">Monthly WhatsApp Enquiries</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {monthlyEnquiries} enquiries / mo
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={800}
                step={20}
                value={monthlyEnquiries}
                onChange={(e) => setMonthlyEnquiries(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-700">
                  Enquiries Currently Missed or Delayed (&gt;30 min)
                </label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {missedRatePct}% ({missedEnquiriesPerMonth} leads/mo)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={2}
                value={missedRatePct}
                onChange={(e) => setMissedRatePct(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-700">Average Salon Booking Ticket</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatCurrency(avgTicket, sym)}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={8000}
                step={100}
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-700">
                  Conversion Rate on AI-Recovered Enquiries
                </label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {recoveryRatePct}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={70}
                step={5}
                value={recoveryRatePct}
                onChange={(e) => setRecoveryRatePct(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 bg-slate-50 rounded-xl p-6 divide-y divide-slate-200">
            <div className="pb-4">
              <p className="text-xs font-medium text-slate-500">Projected Extra Monthly Revenue</p>
              <p className="mt-1 text-3xl font-bold font-mono tabular-nums text-emerald-700">
                {formatCurrency(extraMonthlyRevenue, sym)}
              </p>
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                From {recoveredBookings} recovered bookings every month
              </p>
            </div>
            <div className="py-4 flex items-center justify-between text-sm">
              <span className="text-slate-600">Net Gain After Subscription</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {formatCurrency(netMonthlyGain, sym)} / mo
              </span>
            </div>
            <div className="pt-4 flex items-center justify-between text-sm">
              <span className="text-slate-600">Return on Software Spend</span>
              <span className="font-mono tabular-nums font-bold text-emerald-700">
                {roiMultiple}x ROI
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
