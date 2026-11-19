import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bot,
  Calendar,
  Inbox,
  LayoutDashboard,
  Menu,
  Repeat,
  RotateCcw,
  Settings,
  Users,
  X,
} from 'lucide-react';
import {
  fetchWorkspace,
  resetWorkspace,
  type BusinessPresetSummary,
} from './lib/api';
import { OverviewView } from './components/OverviewView';
import { WhatsAppSimulatorView } from './components/WhatsAppSimulatorView';
import { EnquiriesView } from './components/EnquiriesView';
import { AppointmentsView } from './components/AppointmentsView';
import { LeadsView } from './components/LeadsView';
import { FollowUpsView } from './components/FollowUpsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SetupView } from './components/SetupView';
import type { NavTab, WorkspaceState } from './types/locallift';

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'simulator', label: 'WhatsApp AI', icon: Bot },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'followups', label: 'Follow-Ups', icon: Repeat },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'setup', label: 'AI Setup', icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [presets, setPresets] = useState<BusinessPresetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [switchingPreset, setSwitchingPreset] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspace()
      .then((res) => {
        setState(res.state);
        setPresets(res.presets);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Unable to load workspace');
      })
      .finally(() => setLoading(false));
  }, []);

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 4200);
  }

  async function handleSwitchPreset(presetId: string) {
    setSwitchingPreset(true);
    try {
      const res = await resetWorkspace(presetId);
      setState(res.state);
      notify(`Switched workspace to ${res.state.business.name}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to switch business');
    } finally {
      setSwitchingPreset(false);
    }
  }

  async function handleResetDemo() {
    if (!state) return;
    await handleSwitchPreset(state.business.id);
  }

  const activeNavLabel = NAV_ITEMS.find((i) => i.id === activeTab)?.label ?? 'Overview';
  const pendingOwnerCount =
    state?.enquiries.filter((e) => e.status === 'needs_owner').length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-slate-200 bg-white rounded-xl p-6 space-y-3">
          <p className="text-base font-bold text-slate-900">LocalLift AI</p>
          <p className="text-xs text-slate-500">Loading salon workspace and WhatsApp AI state...</p>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-emerald-700 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-red-200 bg-white rounded-xl p-6 space-y-3">
          <h1 className="text-base font-bold text-slate-900">Unable to load LocalLift AI</h1>
          <p className="text-xs text-red-700">{loadError || 'Server state unavailable.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Wordmark */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setActiveTab('overview');
            setMobileMenuOpen(false);
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          LocalLift <span className="text-emerald-700">AI</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Business Workspace Switcher */}
      <div className="p-4 border-b border-slate-200">
        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
          Demo Business Workspace
        </label>
        <select
          aria-label="Switch demo business"
          disabled={switchingPreset}
          value={state.business.id}
          onChange={(e) => handleSwitchPreset(e.target.value)}
          className="w-full px-2.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] text-slate-500 truncate">
          {state.business.category} · {state.business.city}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </span>
              {item.id === 'enquiries' && pendingOwnerCount > 0 && (
                <span className="text-xs font-mono tabular-nums font-semibold text-amber-700">
                  {pendingOwnerCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quiet Footer Action */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <button
          type="button"
          disabled={switchingPreset}
          onClick={handleResetDemo}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
        <p className="text-[11px] text-slate-400 text-center">
          Never Miss a Customer.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white h-full border-r border-slate-200 shadow-xl">
            {sidebarContent}
          </div>
          <button
            type="button"
            aria-label="Close navigation backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 bg-slate-950/35"
          />
        </div>
      )}

      {/* Workspace Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left + 1 primary CTA on right */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 truncate hidden sm:inline">
                {state.business.name}
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">
                {activeNavLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'simulator' ? (
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open AI Simulator
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Schedule
              </button>
            )}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              state={state}
              onNavigate={setActiveTab}
              onStateChange={setState}
              onNotify={notify}
            />
          )}
          {activeTab === 'simulator' && (
            <WhatsAppSimulatorView
              state={state}
              onStateChange={setState}
              onNavigate={setActiveTab}
              onNotify={notify}
            />
          )}
          {activeTab === 'enquiries' && (
            <EnquiriesView state={state} onStateChange={setState} onNotify={notify} />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsView state={state} onStateChange={setState} onNotify={notify} />
          )}
          {activeTab === 'leads' && (
            <LeadsView state={state} onStateChange={setState} onNotify={notify} />
          )}
          {activeTab === 'followups' && (
            <FollowUpsView state={state} onStateChange={setState} onNotify={notify} />
          )}
          {activeTab === 'analytics' && <AnalyticsView state={state} />}
          {activeTab === 'setup' && (
            <SetupView
              key={state.business.id}
              state={state}
              onStateChange={setState}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      {/* Transient Feedback Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 max-w-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
