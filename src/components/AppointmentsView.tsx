import { useMemo, useState } from 'react';
import { CalendarPlus, Check, Search, Send, X } from 'lucide-react';
import {
  createAppointment,
  formatCurrency,
  sendFollowUpMessage,
  updateAppointment,
} from '../lib/api';
import type { AppointmentStatus, WorkspaceState } from '../types/locallift';

interface AppointmentsViewProps {
  state: WorkspaceState;
  onStateChange: (next: WorkspaceState) => void;
  onNotify: (msg: string) => void;
}

export function AppointmentsView({
  state,
  onStateChange,
  onNotify,
}: AppointmentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+91 ');
  const [formService, setFormService] = useState(state.business.services[0]?.name ?? '');
  const [formDate, setFormDate] = useState('2026-11-20');
  const [formTime, setFormTime] = useState('03:00 PM');
  const [formStylist, setFormStylist] = useState(state.business.ownerName);
  const [formNotes, setFormNotes] = useState('');

  const sym = state.business.currencySymbol;

  const filtered = useMemo(() => {
    return state.appointments.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.customerName.toLowerCase().includes(q) ||
          a.serviceName.toLowerCase().includes(q) ||
          a.stylist.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [state.appointments, statusFilter, search]);

  const confirmedValue = state.appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((s, a) => s + a.price, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formService) return;
    setSaving(true);
    try {
      const res = await createAppointment({
        customerName: formName.trim(),
        customerPhone: formPhone.trim(),
        serviceName: formService,
        date: formDate,
        time: formTime,
        stylist: formStylist.trim() || state.business.ownerName,
        notes: formNotes.trim(),
        status: 'confirmed',
        bookedVia: 'Manual',
      });
      onStateChange(res.state);
      setShowModal(false);
      setFormName('');
      setFormPhone('+91 ');
      setFormNotes('');
      onNotify(`Appointment confirmed for ${res.appointment.customerName}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setBusyId(id);
    try {
      const res = await updateAppointment(id, { status });
      onStateChange(res.state);
      onNotify(`Appointment marked ${status}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendReminder(apt: WorkspaceState['appointments'][number]) {
    setBusyId(apt.id);
    try {
      const res = await sendFollowUpMessage({
        ruleName: 'Same-Day Appointment Reminder',
        recipientName: apt.customerName,
        recipientPhone: apt.customerPhone,
        message: `Hi ${apt.customerName}, friendly reminder for your ${apt.serviceName} at ${state.business.name} on ${apt.date} at ${apt.time}. See you soon!`,
        appointmentId: apt.id,
      });
      onStateChange(res.state);
      onNotify(`WhatsApp reminder sent to ${apt.customerName}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: 'all' | AppointmentStatus; label: string }[] = [
    { key: 'all', label: `All (${state.appointments.length})` },
    {
      key: 'confirmed',
      label: `Confirmed (${state.appointments.filter((a) => a.status === 'confirmed').length})`,
    },
    {
      key: 'pending',
      label: `Pending (${state.appointments.filter((a) => a.status === 'pending').length})`,
    },
    {
      key: 'completed',
      label: `Completed (${state.appointments.filter((a) => a.status === 'completed').length})`,
    },
    {
      key: 'cancelled',
      label: `Cancelled (${state.appointments.filter((a) => a.status === 'cancelled').length})`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Appointments & Schedule</h1>
          <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
            {state.appointments.filter((a) => a.bookedVia === 'WhatsApp AI').length} booked
            autonomously via WhatsApp AI · Confirmed value {formatCurrency(confirmedValue, sym)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === t.key
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
            placeholder="Filter by client, service, stylist..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-5">Client</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Stylist & Channel</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    No appointments match your current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => {
                  const statusTone =
                    apt.status === 'confirmed'
                      ? 'text-emerald-700'
                      : apt.status === 'completed'
                      ? 'text-slate-700'
                      : apt.status === 'pending'
                      ? 'text-amber-700'
                      : 'text-red-700';

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-slate-900">{apt.customerName}</p>
                        <p className="text-xs font-mono tabular-nums text-slate-500">
                          {apt.customerPhone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900">{apt.serviceName}</p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {apt.durationMins} mins
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{apt.date}</p>
                        <p className="text-slate-500">{apt.time}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <p className="text-slate-900 font-medium">{apt.stylist}</p>
                        <p className="text-slate-500">{apt.bookedVia}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(apt.price, sym)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold capitalize ${statusTone}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {apt.status === 'pending' && (
                            <button
                              type="button"
                              disabled={busyId === apt.id}
                              onClick={() => handleStatusChange(apt.id, 'confirmed')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Confirm
                            </button>
                          )}
                          {apt.status === 'confirmed' && (
                            <>
                              {!apt.reminderSent && (
                                <button
                                  type="button"
                                  disabled={busyId === apt.id}
                                  onClick={() => handleSendReminder(apt)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
                                >
                                  <Send className="w-3 h-3" /> Remind
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={busyId === apt.id}
                                onClick={() => handleStatusChange(apt.id, 'completed')}
                                className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              type="button"
                              disabled={busyId === apt.id}
                              onClick={() => handleStatusChange(apt.id, 'cancelled')}
                              className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-red-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">New Appointment Booking</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Aditi Rao"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    required
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stylist</label>
                  <input
                    type="text"
                    value={formStylist}
                    onChange={(e) => setFormStylist(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Service</label>
                <select
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {state.business.services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({formatCurrency(s.price, sym)} · {s.durationMins}m)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                  <input
                    required
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="03:00 PM"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional preference or allergy notes"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
