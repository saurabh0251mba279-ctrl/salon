import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { formatCurrency, saveBusinessProfile } from '../lib/api';
import type { BusinessProfile, WorkspaceState } from '../types/locallift';

interface SetupViewProps {
  state: WorkspaceState;
  onStateChange: (next: WorkspaceState) => void;
  onNotify: (msg: string) => void;
}

export function SetupView({ state, onStateChange, onNotify }: SetupViewProps) {
  const [profile, setProfile] = useState<BusinessProfile>(state.business);
  const [saving, setSaving] = useState(false);

  // New Service inputs
  const [srvName, setSrvName] = useState('');
  const [srvCategory, setSrvCategory] = useState('Hair');
  const [srvPrice, setSrvPrice] = useState('1500');
  const [srvDuration, setSrvDuration] = useState('60');

  // New FAQ inputs
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  async function persist(updated: BusinessProfile, successMsg: string) {
    setSaving(true);
    try {
      const res = await saveBusinessProfile(updated);
      setProfile(res.state.business);
      onStateChange(res.state);
      onNotify(successMsg);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    persist(profile, 'Business profile & AI assistant settings updated');
  }

  function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!srvName.trim()) return;
    const next: BusinessProfile = {
      ...profile,
      services: [
        ...profile.services,
        {
          id: `srv-${Date.now()}`,
          name: srvName.trim(),
          category: srvCategory,
          price: Number(srvPrice) || 1000,
          durationMins: Number(srvDuration) || 60,
        },
      ],
    };
    setSrvName('');
    setSrvPrice('1500');
    setSrvDuration('60');
    persist(next, 'Service added to live AI menu');
  }

  function handleDeleteService(id: string) {
    const next: BusinessProfile = {
      ...profile,
      services: profile.services.filter((s) => s.id !== id),
    };
    persist(next, 'Service removed from AI menu');
  }

  function handleAddFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!faqQ.trim() || !faqA.trim()) return;
    const next: BusinessProfile = {
      ...profile,
      faqs: [
        ...profile.faqs,
        {
          id: `faq-${Date.now()}`,
          question: faqQ.trim(),
          answer: faqA.trim(),
        },
      ],
    };
    setFaqQ('');
    setFaqA('');
    persist(next, 'FAQ added to AI knowledge base');
  }

  function handleDeleteFaq(id: string) {
    const next: BusinessProfile = {
      ...profile,
      faqs: profile.faqs.filter((f) => f.id !== id),
    };
    persist(next, 'FAQ removed from AI knowledge base');
  }

  const sym = profile.currencySymbol;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Assistant & Business Knowledge Base</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Every change here immediately updates how{' '}
          <span className="font-medium text-slate-900">{profile.assistantName}</span> answers
          customers on WhatsApp.
        </p>
      </div>

      {/* Business Identity & Voice */}
      <form
        onSubmit={handleSaveProfile}
        className="border border-slate-200 bg-white rounded-xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Studio Profile & AI Persona</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Core facts, opening hours, and communication tone
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Business Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Owner Name</label>
            <input
              type="text"
              value={profile.ownerName}
              onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              AI Assistant Name
            </label>
            <input
              type="text"
              value={profile.assistantName}
              onChange={(e) => setProfile({ ...profile, assistantName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Working Hours</label>
            <input
              type="text"
              value={profile.hours}
              onChange={(e) => setProfile({ ...profile, hours: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={profile.whatsappNumber}
              onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">AI Reply Tone</label>
            <select
              value={profile.tone}
              onChange={(e) =>
                setProfile({ ...profile, tone: e.target.value as BusinessProfile['tone'] })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="Warm & Boutique">Warm & Boutique</option>
              <option value="Friendly & Local">Friendly & Local</option>
              <option value="Crisp & Professional">Crisp & Professional</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Studio Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Booking & Cancellation Policy
            </label>
            <input
              type="text"
              value={profile.bookingPolicy}
              onChange={(e) => setProfile({ ...profile, bookingPolicy: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </form>

      {/* 2-Column Menu & FAQ Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Service Menu */}
        <section className="lg:col-span-7 border border-slate-200 bg-white rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Service Menu & Pricing ({profile.services.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Used by {profile.assistantName} to quote accurate prices and durations
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {profile.services.map((srv) => (
              <div
                key={srv.id}
                className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{srv.name}</p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    {srv.category} · {srv.durationMins} mins
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatCurrency(srv.price, sym)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${srv.name}`}
                    onClick={() => handleDeleteService(srv.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddService}
            className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
          >
            <input
              type="text"
              required
              value={srvName}
              onChange={(e) => setSrvName(e.target.value)}
              placeholder="New service name..."
              className="sm:col-span-5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              value={srvCategory}
              onChange={(e) => setSrvCategory(e.target.value)}
              placeholder="Category"
              className="sm:col-span-2 px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
            <input
              type="number"
              value={srvPrice}
              onChange={(e) => setSrvPrice(e.target.value)}
              placeholder="Price"
              className="sm:col-span-2 px-2.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
            />
            <input
              type="number"
              value={srvDuration}
              onChange={(e) => setSrvDuration(e.target.value)}
              placeholder="Mins"
              className="sm:col-span-1 px-2 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </section>

        {/* FAQs */}
        <section className="lg:col-span-5 border border-slate-200 bg-white rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Frequently Asked Questions ({profile.faqs.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant answers for parking, products, bridal trials, and policies
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {profile.faqs.map((f) => (
              <div key={f.id} className="px-6 py-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{f.question}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{f.answer}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove FAQ ${f.question}`}
                  onClick={() => handleDeleteFaq(f.id)}
                  className="p-1 text-slate-400 hover:text-red-600 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddFaq}
            className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5"
          >
            <input
              type="text"
              required
              value={faqQ}
              onChange={(e) => setFaqQ(e.target.value)}
              placeholder="Customer question (e.g. Do you accept UPI?)"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
            <textarea
              rows={2}
              required
              value={faqA}
              onChange={(e) => setFaqA(e.target.value)}
              placeholder="Approved answer for AI assistant..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ to Knowledge Base
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
