import { useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  ChevronRight,
  Clock,
  XCircle,
  ClipboardPlus,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  KeyRound,
  LockKeyhole,
  PackageCheck,
  Pill,
  QrCode,
  Ruler,
  Scale,
  Settings,
  ShieldCheck,
  Stethoscope,
  Tablets,
  TimerReset,
  TrendingUp,
  UserRound,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useDoses, useConsents, useFamilyData, useHistoryData } from '@/lib/hooks';
import type { Dose, FamilyDoseRow, FamilyPrescriptionRow, FamilyLabRow, FamilyMemberRow, TreatmentHistoryRow, TreatmentSharingRow, VitalRow } from '@/lib/hooks';
import { formatToday, daysUntil } from '@/lib/dates';
import { useEscapeKey } from '@/lib/useEscapeKey';
import { useToast } from '@/components/Toast';
import { ShimmerCard, ShimmerList } from '@/components/Shimmer';
import { CameraModal, type CameraMode } from '@/components/CameraModal';
import { PrescriptionReviewScreen } from '@/components/PrescriptionReviewScreen';
import type { ExtractedMedicine } from '@/lib/ocr';
import { useScannedRefills, useSavePrescription } from '@/lib/scan';
import { RefillReviewScreen } from '@/components/RefillReviewScreen';

type Tab = 'home' | 'prescriptions' | 'labs' | 'family' | 'settings';
type SettingsSubpage = 'consent' | 'services' | 'security' | 'clinic' | 'doctor';
type DoseStatus = 'taken' | 'missed' | 'upcoming';

type LabResult = {
  name: string;
  value: string;
  reference: string;
  status: 'Normal' | 'Borderline';
};

type Prescription = {
  id: string;
  name: string;
  dose: string;
  daysRemaining: number;
  refillDate: string;
  status: 'Active' | 'Refill needed';
};

const navItems: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'home', label: 'Home/Card', icon: HeartPulse },
  { id: 'prescriptions', label: 'Your History', icon: ClipboardPlus },
  { id: 'labs', label: 'Lab Reports', icon: ClipboardPlus },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const labResults: LabResult[] = [
  { name: 'HbA1c', value: '6.8%', reference: 'Ref: < 7.0% · Sep 3, 2026', status: 'Normal' },
  { name: 'Fasting Glucose', value: '104 mg/dL', reference: 'Ref: 70–99 · Sep 3, 2026', status: 'Borderline' },
  { name: 'LDL Cholesterol', value: '88 mg/dL', reference: 'Ref: < 100 · Aug 18, 2026', status: 'Normal' },
  { name: 'Creatinine', value: '0.92 mg/dL', reference: 'Ref: 0.7–1.2 · Aug 18, 2026', status: 'Normal' },
  { name: 'eGFR', value: '78 mL/min', reference: 'Ref: > 60 · Aug 18, 2026', status: 'Normal' },
];

const userPrescriptions: Prescription[] = [
  { id: 'up1', name: 'Metformin 500mg', dose: '2x Daily', daysRemaining: 18, refillDate: 'Sep 30, 2026', status: 'Active' },
  { id: 'up2', name: 'Lisinopril 10mg', dose: '1x Daily', daysRemaining: 7, refillDate: 'Sep 19, 2026', status: 'Active' },
  { id: 'up3', name: 'Atorvastatin 20mg', dose: '1x Nightly', daysRemaining: 2, refillDate: 'Sep 14, 2026', status: 'Refill needed' },
  { id: 'up4', name: 'Aspirin 81mg', dose: '1x Daily', daysRemaining: 24, refillDate: 'Oct 6, 2026', status: 'Active' },
];

type FamilyMember = FamilyMemberRow & {
  doses: FamilyDoseRow[];
  prescriptions: FamilyPrescriptionRow[];
  labs: FamilyLabRow[];
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [settingsSubpage, setSettingsSubpage] = useState<SettingsSubpage | null>(null);
  const [scanMode, setScanMode] = useState<CameraMode>('refill');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showRefillReview, setShowRefillReview] = useState(false);
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<ExtractedMedicine[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(true);
  const [dosageDetailOpen, setDosageDetailOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [familyDetailId, setFamilyDetailId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tabTransitioning, setTabTransitioning] = useState(false);

  const { doses, loading: dosesLoading, markDose, refetch: refetchDoses } = useDoses();
  const { consents, loading: consentsLoading, toggleConsent } = useConsents();
  const { data: familyData, loading: familyLoading } = useFamilyData();
  const { data: historyData, loading: historyLoading, toggleSharing } = useHistoryData();
  const { toast, showToast } = useToast();
  const { saveRefill } = useScannedRefills();
  const { saving: savingPrescription, savePrescription } = useSavePrescription();

  function selectTab(tab: Tab) {
    if (tab === activeTab) return;
    setTabTransitioning(true);
    setActiveTab(tab);
    setSettingsSubpage(null);
    window.setTimeout(() => setTabTransitioning(false), 200);
  }

  function handleScan(mode: CameraMode) {
    if (isScanning) return;
    setScanMode(mode);
    setCameraError(null);
    setCapturedPhoto(null);
    setPrescriptionMedicines([]);
    setScanError(null);
    setCameraOpen(true);
  }

  function handleCapture(imageData: string) {
    setCameraOpen(false);
    setCapturedPhoto(imageData);
    if (scanMode === 'prescription') {
      setPrescriptionMedicines([]);
      setShowReview(true);
    } else {
      setShowRefillReview(true);
    }
  }

  async function handleConfirmRefill(medication: string, batchNumber: string) {
    await saveRefill(medication, batchNumber);
    showToast(`${medication} refill confirmed`);
    setShowRefillReview(false);
    setCapturedPhoto(null);
  }

  async function handleSavePrescription(medicines: Array<{ medication: string; amount: string; frequency: string; time_label: string; time: string }>) {
    const success = await savePrescription(medicines);
    if (success) {
      showToast(`${medicines.length} medicine${medicines.length === 1 ? '' : 's'} added to your tracker`);
      setShowReview(false);
      setPrescriptionMedicines([]);
      setCapturedPhoto(null);
      refetchDoses();
    } else {
      showToast('Could not save medicines. Please try again.');
    }
  }

  function handleMarkDose(id: string) {
    markDose(id);
    const dose = doses.find((d) => d.id === id);
    if (dose) showToast(`${dose.medication} ${dose.amount} marked as taken`);
  }

  const familyMembers: FamilyMember[] = familyData.members.map((m) => ({
    ...m,
    doses: familyData.doses.filter((d) => d.member_id === m.id),
    prescriptions: familyData.prescriptions.filter((p) => p.member_id === m.id),
    labs: familyData.labs.filter((l) => l.member_id === m.id),
  }));

  const familyDetailMember = familyDetailId ? familyMembers.find((m) => m.id === familyDetailId) ?? null : null;

  const hasRefillAlerts = userPrescriptions.some((rx) => daysUntil(rx.refillDate) <= 3);

  return (
    <main className="min-h-screen bg-slate-200 px-3 py-6 text-slate-900 sm:px-5">
      <div className="mx-auto my-0 flex min-h-[844px] max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex-1 overflow-y-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Header onOpenNotifications={() => setNotificationsOpen(true)} hasRefillAlerts={hasRefillAlerts} />
          <div className={`transition-opacity duration-200 ${tabTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {activeTab === 'home' && (
              <HomeView
                isScanning={isScanning}
                scanMode={scanMode}
                scanError={scanError}
                onScan={handleScan}
                onDismissError={() => setScanError(null)}
                privacyOpen={privacyOpen}
                setPrivacyOpen={setPrivacyOpen}
                consents={consents}
                consentsLoading={consentsLoading}
                toggleConsent={toggleConsent}
                doses={doses}
                dosesLoading={dosesLoading}
                onOpenDosageDetail={() => setDosageDetailOpen(true)}
              />
            )}
            {activeTab === 'prescriptions' && (
              <HistoryView
                onBack={() => selectTab('home')}
                treatments={historyData.treatments}
                sharing={historyData.sharing}
                vitals={historyData.vitals}
                loading={historyLoading}
                onToggleSharing={toggleSharing}
                showToast={showToast}
              />
            )}
            {activeTab === 'labs' && <LabsView onBack={() => selectTab('home')} />}
            {activeTab === 'family' && (
              <FamilyView
                onBack={() => selectTab('home')}
                onOpenMember={(id) => setFamilyDetailId(id)}
                members={familyMembers}
                loading={familyLoading}
              />
            )}
            {activeTab === 'settings' &&
              (settingsSubpage ? (
                <SettingsSubpageView page={settingsSubpage} onBack={() => setSettingsSubpage(null)} />
              ) : (
                <SettingsView consents={consents} onBack={() => selectTab('home')} onOpen={setSettingsSubpage} />
              ))}
          </div>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={selectTab} />
      </div>
      {cameraOpen && <CameraModal mode={scanMode} onClose={() => setCameraOpen(false)} onCapture={handleCapture} error={cameraError} setError={setCameraError} />}
      {showReview && capturedPhoto && (
        <PrescriptionReviewScreen
          medicines={prescriptionMedicines}
          photo={capturedPhoto}
          onSave={handleSavePrescription}
          onCancel={() => { setShowReview(false); setPrescriptionMedicines([]); setCapturedPhoto(null); }}
          saving={savingPrescription}
        />
      )}
      {showRefillReview && capturedPhoto && (
        <RefillReviewScreen
          photo={capturedPhoto}
          onSave={handleConfirmRefill}
          onCancel={() => { setShowRefillReview(false); setCapturedPhoto(null); }}
          saving={false}
        />
      )}
      {dosageDetailOpen && <DosageDetailView doses={doses} onMarkDose={handleMarkDose} onClose={() => setDosageDetailOpen(false)} />}
      {notificationsOpen && <NotificationsPanel doses={doses} onClose={() => setNotificationsOpen(false)} />}
      {familyDetailMember && <FamilyMemberDetailView member={familyDetailMember} onClose={() => setFamilyDetailId(null)} />}
      {toast}
    </main>
  );
}

function Header({ onOpenNotifications, hasRefillAlerts }: { onOpenNotifications: () => void; hasRefillAlerts: boolean }) {
  return (
    <header className="flex items-center justify-between py-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Welcome back</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          My Health <span className="ml-1 rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-600">ID: #PX-9921</span>
        </h1>
      </div>
      <button
        aria-label="Open medicine reminders"
        onClick={onOpenNotifications}
        className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <Bell size={18} strokeWidth={1.8} />
        <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ring-2 ring-white ${hasRefillAlerts ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      </button>
    </header>
  );
}

function HomeView({
  isScanning,
  scanMode,
  scanError,
  onScan,
  onDismissError,
  privacyOpen,
  setPrivacyOpen,
  consents,
  consentsLoading,
  toggleConsent,
  doses,
  dosesLoading,
  onOpenDosageDetail,
}: {
  isScanning: boolean;
  scanMode: CameraMode;
  scanError: string | null;
  onScan: (mode: CameraMode) => void;
  onDismissError: () => void;
  privacyOpen: boolean;
  setPrivacyOpen: (value: boolean) => void;
  consents: { biometrics: boolean; rx: boolean; history: boolean };
  consentsLoading: boolean;
  toggleConsent: (key: 'biometrics' | 'rx' | 'history') => void;
  doses: Dose[];
  dosesLoading: boolean;
  onOpenDosageDetail: () => void;
}) {
  const scanningLabel = scanMode === 'prescription' ? 'Opening prescription scanner...' : 'Opening refill scanner...';

  return (
    <div className="space-y-4">
      <HealthCard />
      {dosesLoading ? (
        <ShimmerCard />
      ) : (
        <DosageTrackerCard doses={doses} onClick={onOpenDosageDetail} />
      )}
      <WeeklyAdherenceCard doses={doses} loading={dosesLoading} />
      <section className="space-y-2.5">
        <button
          onClick={() => onScan('refill')}
          disabled={isScanning}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-wait disabled:bg-emerald-600"
        >
          {isScanning && scanMode === 'refill' ? <TimerReset className="animate-spin" size={19} /> : <PackageCheck size={19} />}
          <span>{isScanning && scanMode === 'refill' ? scanningLabel : 'Scan Refill'}</span>
          {!isScanning && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Open Camera</span>}
        </button>
        <button
          onClick={() => onScan('prescription')}
          disabled={isScanning}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600 active:scale-[0.99] disabled:cursor-wait disabled:bg-indigo-600"
        >
          {isScanning && scanMode === 'prescription' ? <TimerReset className="animate-spin" size={19} /> : <FileText size={19} />}
          <span>{isScanning && scanMode === 'prescription' ? scanningLabel : 'Scan Prescription'}</span>
          {!isScanning && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Open Camera</span>}
        </button>
        {scanError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs leading-5 text-rose-800">
            <CircleAlert className="mt-0.5 shrink-0" size={15} />
            <p>{scanError}</p>
            <button aria-label="Dismiss error" onClick={onDismissError} className="ml-auto text-rose-500"><X size={14} /></button>
          </div>
        )}

      </section>
      <FollowUpCard />
      <TelemetryCard />
      <ConsentCard open={privacyOpen} setOpen={setPrivacyOpen} consents={consents} loading={consentsLoading} toggleConsent={toggleConsent} />
    </div>
  );
}

function HealthCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 p-5 text-white shadow-lg shadow-indigo-900/20">
      <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full border-[20px] border-white/5" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LockKeyhole size={15} />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]">DoseTrace Universal Health ID</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9px] font-semibold text-indigo-100">
          <ShieldCheck size={11} /> End-to-end encrypted
        </span>
      </div>
      <div className="relative mt-7 grid grid-cols-[1fr_auto] gap-4">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-indigo-200">Private Patient ID</p>
            <p className="mt-1 font-mono text-sm font-semibold">PX-9921-ND</p>
          </div>
          <div className="flex gap-7">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-indigo-200">Blood Group</p>
              <p className="mt-1 text-sm font-semibold">O+</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-indigo-200">Active Clinic</p>
              <p className="mt-1 max-w-[150px] text-xs font-medium leading-4">Outpatient Cardiology Unit</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-xl bg-white p-2">
            <QrCode size={56} className="text-slate-900" strokeWidth={1.6} />
          </div>
          <p className="mt-2 max-w-[76px] text-center text-[8px] leading-3 text-indigo-100">Scan at chemist/clinic for instant Rx sync</p>
        </div>
      </div>
      <div className="relative mt-5 flex items-center gap-2 border-t border-white/15 pt-3 text-[10px] font-medium text-indigo-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.15)]" />
        Sharing permissions active <span className="text-indigo-300">•</span> 3 services connected
      </div>
    </section>
  );
}

function WeeklyAdherenceCard({ doses, loading }: { doses: Dose[]; loading: boolean }) {
  if (loading || doses.length === 0) return null;
  const taken = doses.filter((d) => d.status === 'taken').length;
  const total = doses.length;
  const todayPct = Math.round((taken / total) * 100);
  const weeklyPct = Math.min(100, Math.round(todayPct * 0.85 + 15));

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><TrendingUp size={17} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This week</p>
            <h2 className="mt-0.5 text-sm font-bold text-slate-900">Medicine tracking</h2>
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${weeklyPct >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {weeklyPct >= 80 ? 'On track' : 'Behind'}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{weeklyPct}<span className="text-sm font-medium text-slate-400">%</span></p>
          <p className="text-[10px] text-slate-400">of doses taken this week</p>
        </div>
        <div className="flex items-end gap-1.5">
          {[60, 80, 100, 75, 90, 85, todayPct].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-16 w-4 items-end">
                <div
                  style={{ height: `${h}%` }}
                  className={`w-full rounded-full ${i === 6 ? 'bg-indigo-500' : 'bg-slate-200'}`}
                />
              </div>
              <span className="text-[7px] font-medium text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FollowUpCard() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><CalendarDays size={16} /></span>
        <h2 className="text-xs font-bold text-slate-800">Schedule & Doctor Follow-up</h2>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3">
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">Cardiology Follow-up</p>
            <p className="mt-1 text-[10px] text-slate-400">Dr. Aisha Okonkwo · Cardiology</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-indigo-600">Oct 20</p>
            <p className="mt-1 font-mono text-[10px] text-slate-400">10:30 AM</p>
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-emerald-600"><TimerReset size={13} /> Synced with your medicine supply</p>
    </section>
  );
}

function TelemetryCard() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-rose-50 p-2 text-rose-500"><HeartPulse size={17} /></span>
          <h2 className="text-xs font-bold text-slate-800">Health Tracking</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">Live</span>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-rose-50/70 px-3 py-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Apple HealthKit Connected</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">71 <span className="text-xs font-medium text-slate-500">bpm</span></p>
          <p className="text-[10px] text-slate-500">Resting Heart Rate: Normal</p>
        </div>
        <Activity size={58} strokeWidth={1.5} className="text-rose-400" />
      </div>
      <p className="mt-3 text-[10px] text-slate-400">Automatic tracking is on. No manual checklists needed.</p>
    </section>
  );
}

function ConsentCard({
  open,
  setOpen,
  consents,
  loading,
  toggleConsent,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  consents: { biometrics: boolean; rx: boolean; history: boolean };
  loading: boolean;
  toggleConsent: (key: 'biometrics' | 'rx' | 'history') => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-4 text-left">
        <span className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 p-2 text-slate-600"><KeyRound size={16} /></span>
          <span className="text-xs font-bold text-slate-800">Privacy & Sharing</span>
        </span>
        <ChevronRight size={16} className={`text-slate-400 transition ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3">
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : (
            <>
              <ConsentRow label="Share health data with doctor" detail="Heart rate and activity" checked={consents.biometrics} onChange={() => toggleConsent('biometrics')} />
              <ConsentRow label="Sync chemist 'Rx Served' events" detail="Prescription data from WONDRx" checked={consents.rx} onChange={() => toggleConsent('rx')} />
              <ConsentRow label="Share history across clinics" detail="Sharing your history across clinics" checked={consents.history} onChange={() => toggleConsent('history')} />
            </>
          )}
        </div>
      )}
    </section>
  );
}

function ConsentRow({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-3 first:border-t-0">
      <div>
        <p className="text-[11px] font-semibold text-slate-700">{label}</p>
        <p className="mt-0.5 text-[9px] text-slate-400">{detail}</p>
      </div>
      <button role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function HistoryView({
  onBack,
  treatments,
  sharing,
  vitals,
  loading,
  onToggleSharing,
  showToast,
}: {
  onBack: () => void;
  treatments: TreatmentHistoryRow[];
  sharing: TreatmentSharingRow[];
  vitals: VitalRow[];
  loading: boolean;
  onToggleSharing: (sharingId: string, hidden: boolean) => void;
  showToast: (message: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeTreatments = treatments.filter((t) => t.status === 'active');
  const pastTreatments = treatments.filter((t) => t.status === 'completed');

  const vitalIcons: Record<string, typeof Scale> = {
    'Body Weight': Scale,
    'Height': Ruler,
    'BMI': Activity,
    'Blood Pressure': HeartPulse,
    'Resting Heart Rate': HeartPulse,
  };

  function handleToggleSharing(sharingId: string, doctorName: string, hidden: boolean, isPrescribing: boolean) {
    if (isPrescribing) return;
    onToggleSharing(sharingId, hidden);
    showToast(hidden ? `Hidden from ${doctorName}` : `Shared with ${doctorName}`);
  }

  if (loading) {
    return (
      <PageShell title="Your History" subtitle="Treatment history, vitals & sharing" onBack={onBack}>
        <ShimmerList count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title="Your History" subtitle="Treatment history, vitals & sharing" onBack={onBack}>
      <div className="space-y-5">
        <VitalsCard vitals={vitals} vitalIcons={vitalIcons} />

        <div>
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Treatments</h3>
            <span className="ml-auto text-[10px] font-medium text-slate-400">{activeTreatments.length} ongoing</span>
          </div>
          <div className="space-y-3">
            {activeTreatments.map((tx) => (
              <TreatmentCard
                key={tx.id}
                treatment={tx}
                sharing={sharing.filter((s) => s.treatment_id === tx.id)}
                expanded={expandedId === tx.id}
                onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                onToggleSharing={handleToggleSharing}
              />
            ))}
          </div>
        </div>

        {pastTreatments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 pb-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Past Treatments</h3>
              <span className="ml-auto text-[10px] font-medium text-slate-400">{pastTreatments.length} completed</span>
            </div>
            <div className="space-y-3">
              {pastTreatments.map((tx) => (
                <TreatmentCard
                  key={tx.id}
                  treatment={tx}
                  sharing={sharing.filter((s) => s.treatment_id === tx.id)}
                  expanded={expandedId === tx.id}
                  onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                  onToggleSharing={handleToggleSharing}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function VitalsCard({ vitals, vitalIcons }: { vitals: VitalRow[]; vitalIcons: Record<string, typeof Scale> }) {
  if (vitals.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Activity size={16} /></span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Body metrics</p>
          <h2 className="mt-0.5 text-sm font-bold text-slate-900">Vitals & Measurements</h2>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {vitals.map((v) => {
          const Icon = vitalIcons[v.vital_type] ?? Activity;
          return (
            <div key={v.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="flex items-center gap-1.5">
                <Icon size={13} className="text-slate-400" />
                <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{v.vital_type}</p>
              </div>
              <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">
                {v.value}<span className="ml-1 text-[10px] font-medium text-slate-400">{v.unit}</span>
              </p>
              <p className="mt-0.5 text-[9px] text-slate-400">{v.date_recorded}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TreatmentCard({
  treatment,
  sharing,
  expanded,
  onToggle,
  onToggleSharing,
}: {
  treatment: TreatmentHistoryRow;
  sharing: TreatmentSharingRow[];
  expanded: boolean;
  onToggle: () => void;
  onToggleSharing: (sharingId: string, doctorName: string, hidden: boolean, isPrescribing: boolean) => void;
}) {
  const isActive = treatment.status === 'active';
  const visibleCount = sharing.filter((s) => !s.hidden).length;
  const hiddenCount = sharing.filter((s) => s.hidden).length;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition ${isActive ? 'border-slate-100' : 'border-slate-100 opacity-75'}`}>
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left">
        <span className={`mt-0.5 rounded-lg p-2 ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          <Pill size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-bold text-slate-900">{treatment.treatment_name}</p>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              {isActive ? 'Active' : 'Past'}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500">{treatment.medication} · {treatment.dosage}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{treatment.condition_treated}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-slate-400">
            <span className="flex items-center gap-1"><Stethoscope size={10} /> {treatment.doctor_name}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1"><CalendarDays size={10} /> {treatment.start_date}{treatment.end_date ? ` → ${treatment.end_date}` : ' → present'}</span>
          </div>
        </div>
        <ChevronRight size={16} className={`mt-1 shrink-0 text-slate-300 transition ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shared with doctors</p>
            <span className="text-[9px] text-slate-400">{visibleCount} visible{hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}</span>
          </div>
          <div className="mt-2 space-y-2">
            {sharing.map((s) => (
              <div key={s.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${s.hidden ? 'bg-slate-50' : 'bg-white border border-slate-100'}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                  {s.doctor_name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-slate-700">{s.doctor_name}</p>
                  <p className="text-[9px] text-slate-400">{s.doctor_specialty}{s.is_prescribing_doctor ? ' · Prescribing doctor' : ''}</p>
                </div>
                {s.is_prescribing_doctor ? (
                  <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-indigo-50 px-2 py-1 text-[8px] font-bold text-indigo-600">
                    <LockKeyhole size={9} /> Locked
                  </span>
                ) : (
                  <button
                    onClick={() => onToggleSharing(s.id, s.doctor_name, !s.hidden, s.is_prescribing_doctor)}
                    className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[8px] font-bold transition ${s.hidden ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {s.hidden ? <><EyeOff size={9} /> Hidden</> : <><Eye size={9} /> Visible</>}
                  </button>
                )}
              </div>
            ))}
          </div>
          {hiddenCount > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-400"><LockKeyhole size={10} /> You cannot hide a treatment from the prescribing doctor.</p>
          )}
        </div>
      )}
    </div>
  );
}

function LabsView({ onBack }: { onBack: () => void }) {
  return (
    <PageShell title="Lab Reports" subtitle="Most recent panel · Outpatient Cardiology Unit" onBack={onBack}>
      <div className="space-y-3">
        {labResults.map((result) => (
          <div key={result.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-800">{result.name}</p>
              <p className="mt-1 text-[10px] text-slate-400">{result.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{result.value}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-1 text-[9px] font-bold ${result.status === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{result.status}</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function SettingsView({ consents, onBack, onOpen }: { consents: { biometrics: boolean; rx: boolean; history: boolean }; onBack: () => void; onOpen: (page: SettingsSubpage) => void }) {
  return (
    <PageShell title="Settings" subtitle="Your health data, your choices" onBack={onBack}>
      <div className="space-y-4">
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">JM</div>
          <p className="mt-3 text-sm font-bold">Jordan M.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">ID: #PX-9921</p>
        </div>
        <SettingsGroup title="Privacy overview">
          <SettingsItem icon={ShieldCheck} label="Sharing permissions" value={`${Object.values(consents).filter(Boolean).length} of 3 active`} onClick={() => onOpen('consent')} />
          <SettingsItem icon={Wifi} label="Connected services" value="3 streams" onClick={() => onOpen('services')} />
          <SettingsItem icon={LockKeyhole} label="Security" value="End-to-end encrypted" onClick={() => onOpen('security')} />
        </SettingsGroup>
        <SettingsGroup title="Care team">
          <SettingsItem icon={Stethoscope} label="Outpatient Cardiology Unit" value="Active clinic" onClick={() => onOpen('clinic')} />
          <SettingsItem icon={UserRound} label="Dr. Aisha Okonkwo" value="Cardiology" onClick={() => onOpen('doctor')} />
        </SettingsGroup>
      </div>
    </PageShell>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function SettingsItem({ icon: Icon, label, value, onClick }: { icon: typeof ShieldCheck; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 first:border-t-0">
      <Icon size={16} className="text-indigo-500" />
      <p className="flex-1 text-xs font-semibold text-slate-700">{label}</p>
      <span className="text-[10px] text-slate-400">{value}</span>
      <ChevronRight size={14} className="text-slate-300" />
    </button>
  );
}

function PageShell({ title, subtitle, children, onBack }: { title: string; subtitle: string; children: ReactNode; onBack: () => void }) {
  return (
    <div className="pb-4">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button aria-label={`Back from ${title}`} onClick={onBack} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100">
            <ArrowRight size={16} className="rotate-180" />
          </button>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
        </div>
        <p className="mt-4 text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SettingsSubpageView({ page, onBack }: { page: SettingsSubpage; onBack: () => void }) {
  const content: Record<SettingsSubpage, { title: string; subtitle: string; heading: string; detail: string }> = {
    consent: { title: 'Sharing permissions', subtitle: 'Control what health data you share', heading: 'Your active permissions', detail: 'Review and adjust the three sharing settings connected to DoseTrace. Changes apply right away to future data sharing.' },
    services: { title: 'Connected services', subtitle: 'Apps and devices linked to DoseTrace', heading: '3 services connected', detail: 'WONDRx Smart Pen, Apple HealthKit, and your clinic are currently connected for shared care.' },
    security: { title: 'Security', subtitle: 'How your health data stays protected', heading: 'End-to-end encrypted', detail: 'Your Universal Health ID and connected health data use end-to-end encrypted transfer and anonymized patient identifiers.' },
    clinic: { title: 'Outpatient Cardiology Unit', subtitle: 'Active clinic', heading: 'Your care team', detail: 'This clinic can access the care data you have shared, including your medicines, health tracking, and lab reports.' },
    doctor: { title: 'Dr. Aisha Okonkwo', subtitle: 'Cardiology · Outpatient Cardiology Unit', heading: 'Next appointment · Oct 20', detail: 'Your routine follow-up is scheduled for 10:30 AM. Your current medicine supply and latest health data will be ready for review.' },
  };
  const details = content[page];
  return (
    <PageShell title={details.title} subtitle={details.subtitle} onBack={onBack}>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck size={22} /></div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">{details.heading}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">{details.detail}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected and up to date</p>
        </div>
      </div>
    </PageShell>
  );
}

type NotificationReminder = {
  id: string;
  medication: string;
  amount: string;
  time: string;
  timeLabel: string;
  status: DoseStatus;
  refillDate: string;
};

function buildReminders(doses: Dose[]): NotificationReminder[] {
  const refillDates: Record<string, string> = {};
  for (const rx of userPrescriptions) {
    const baseName = rx.name.replace(/\s*\d+mg\s*|\s*\d+mcg\s*/i, '').trim().toLowerCase();
    refillDates[baseName] = rx.refillDate;
  }
  return doses.map((dose) => {
    const baseName = dose.medication.toLowerCase();
    const refillDate = refillDates[baseName] ?? 'Oct 18, 2026';
    return {
      id: dose.id,
      medication: dose.medication,
      amount: dose.amount,
      time: dose.time,
      timeLabel: dose.time_label,
      status: dose.status,
      refillDate,
    };
  });
}

function NotificationsPanel({ doses, onClose }: { doses: Dose[]; onClose: () => void }) {
  useEscapeKey(onClose);
  const reminders = buildReminders(doses);

  const sortedReminders = [...reminders].sort((a, b) => {
    const dateA = new Date(a.refillDate);
    const dateB = new Date(b.refillDate);
    return dateA.getTime() - dateB.getTime();
  });

  function autoStatus(reminder: NotificationReminder): 'taken' | 'missed' | 'upcoming' | 'refill-soon' {
    const days = daysUntil(reminder.refillDate);
    if (days <= 3) return 'refill-soon';
    return reminder.status;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-3 pt-20 backdrop-blur-sm sm:pt-10" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Past notifications</p>
            <h2 className="mt-1 text-base font-bold text-slate-900">Medicine reminders</h2>
          </div>
          <button aria-label="Close medicine reminders" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"><X size={17} /></button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortedReminders.map((reminder) => {
            const status = autoStatus(reminder);
            const days = daysUntil(reminder.refillDate);
            const isTaken = status === 'taken';
            const isMissed = status === 'missed';
            const isRefillSoon = status === 'refill-soon';
            return (
              <div key={reminder.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${isTaken ? 'border-emerald-100 bg-emerald-50/70' : isMissed ? 'border-rose-100 bg-rose-50/70' : 'border-amber-100 bg-amber-50/70'}`}>
                <span className={`rounded-xl bg-white p-2 ${isTaken ? 'text-emerald-600' : isMissed ? 'text-rose-500' : 'text-amber-500'}`}><Pill size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{reminder.medication} <span className="font-medium text-slate-500">({reminder.amount})</span></p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{reminder.timeLabel} · {reminder.time}</p>
                  {isRefillSoon && <p className="mt-0.5 text-[9px] font-semibold text-amber-600">Refill in {days} day{days === 1 ? '' : 's'} · {reminder.refillDate}</p>}
                </div>
                <span className={`flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-2 py-1 text-[9px] font-bold ${isTaken ? 'text-emerald-600' : isMissed ? 'text-rose-600' : 'text-amber-600'}`}>
                  {isTaken ? <CheckCircle2 size={11} /> : isMissed ? <XCircle size={11} /> : <TimerReset size={11} />}
                  {isTaken ? 'Taken' : isMissed ? 'Missed' : 'Refill soon'}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 px-2 py-2 text-[10px] text-slate-400"><Clock size={13} /> Your next reminder is Atorvastatin 20mg at 10:00 PM.</div>
        </div>
      </div>
    </div>
  );
}

function DosageTrackerCard({ doses, onClick }: { doses: Dose[]; onClick: () => void }) {
  const taken = doses.filter((d) => d.status === 'taken').length;
  const missed = doses.filter((d) => d.status === 'missed').length;
  const upcoming = doses.filter((d) => d.status === 'upcoming').length;
  const total = doses.length;
  const pct = Math.round((taken / total) * 100);
  const allTaken = taken === total;
  const hasMissed = missed > 0;

  return (
    <button onClick={onClick} className="flex w-full flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Tablets size={17} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's medicines</p>
            <h2 className="mt-0.5 text-sm font-bold text-slate-900">Medicine tracker</h2>
          </div>
        </div>
        <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-bold ${allTaken ? 'bg-emerald-50 text-emerald-600' : hasMissed ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
          {allTaken ? 'All taken' : hasMissed ? `${missed} missed` : `${upcoming} upcoming`}
        </span>
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-[10px] font-medium text-slate-500">
          <span>{taken} of {total} doses taken</span>
          <span>{pct}%</span>
        </div>
        <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-slate-100">
          <div style={{ width: `${(taken / total) * 100}%` }} className="h-2 rounded-full bg-emerald-500" />
          {missed > 0 && <div style={{ width: `${(missed / total) * 100}%` }} className="h-2 rounded-full bg-rose-400" />}
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 size={12} /> {taken} taken</span>
        <span className="flex items-center gap-1 font-medium text-rose-500"><XCircle size={12} /> {missed} missed</span>
        <span className="flex items-center gap-1 font-medium text-slate-400"><Clock size={12} /> {upcoming} upcoming</span>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-semibold text-indigo-600">
        <span>View full routine</span>
        <ChevronRight size={14} />
      </div>
    </button>
  );
}

function DosageDetailView({ doses, onMarkDose, onClose }: { doses: Dose[]; onMarkDose: (id: string) => void; onClose: () => void }) {
  useEscapeKey(onClose);
  const taken = doses.filter((d) => d.status === 'taken').length;
  const missed = doses.filter((d) => d.status === 'missed').length;
  const upcoming = doses.filter((d) => d.status === 'upcoming').length;
  const total = doses.length;
  const pct = Math.round((taken / total) * 100);

  const statusConfig: Record<DoseStatus, { label: string; icon: typeof Check; color: string; bg: string; border: string }> = {
    taken: { label: 'Taken', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    missed: { label: 'Missed', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    upcoming: { label: 'Upcoming', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Tablets size={18} /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Medicine Routine</h2>
              <p className="text-[10px] text-slate-400">{formatToday()}</p>
            </div>
          </div>
          <button aria-label="Close dosage detail" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex justify-between text-[10px] font-medium text-slate-500">
              <span>Today's progress</span>
              <span>{taken} of {total} doses · {pct}%</span>
            </div>
            <div className="flex h-2.5 gap-1 overflow-hidden rounded-full bg-slate-100">
              <div style={{ width: `${(taken / total) * 100}%` }} className="h-2.5 rounded-full bg-emerald-500" />
              {missed > 0 && <div style={{ width: `${(missed / total) * 100}%` }} className="h-2.5 rounded-full bg-rose-400" />}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 size={12} /> {taken} taken</span>
              <span className="flex items-center gap-1 font-medium text-rose-500"><XCircle size={12} /> {missed} missed</span>
              <span className="flex items-center gap-1 font-medium text-slate-400"><Clock size={12} /> {upcoming} upcoming</span>
            </div>
          </div>
          <div className="space-y-3">
            {doses.map((dose) => {
              const config = statusConfig[dose.status];
              const StatusIcon = config.icon;
              const isTaken = dose.status === 'taken';
              return (
                <div key={dose.id} className={`rounded-2xl border ${config.border} ${config.bg} p-4 transition-all duration-300 ${isTaken ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg bg-white p-2 ${config.color}`}><Pill size={16} /></span>
                      <div>
                        <p className={`text-xs font-bold ${isTaken ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{dose.medication} <span className="font-medium text-slate-500">({dose.amount})</span></p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400"><Clock size={11} /> {dose.time_label} · {dose.time}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => !isTaken && onMarkDose(dose.id)}
                      disabled={isTaken}
                      aria-label={isTaken ? 'Medicine taken' : 'Mark as taken'}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 active:scale-90 ${
                        isTaken
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                    >
                      <Check size={18} strokeWidth={3} />
                    </button>
                  </div>
                  {!isTaken && (
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${config.color}`}>
                        <StatusIcon size={11} /> {config.label}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">Tap checkbox when taken</span>
                    </div>
                  )}
                  {isTaken && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-emerald-100 pt-2 text-[10px] font-semibold text-emerald-600">
                      <CheckCircle2 size={12} /> Taken today
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FamilyView({
  onBack,
  onOpenMember,
  members,
  loading,
}: {
  onBack: () => void;
  onOpenMember: (id: string) => void;
  members: FamilyMember[];
  loading: boolean;
}) {
  const statusConfig: Record<FamilyMember['status'], { label: string; color: string; bg: string; dot: string }> = {
    good: { label: 'Doing well', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    attention: { label: 'Needs attention', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    critical: { label: 'Critical', color: 'text-rose-600', bg: 'bg-rose-50', dot: 'bg-rose-500' },
  };

  const goodCount = members.filter((m) => m.status === 'good').length;
  const attentionCount = members.filter((m) => m.status === 'attention').length;

  return (
    <PageShell title="Family Status" subtitle="Health overview for your family members" onBack={onBack}>
      {loading ? (
        <ShimmerList count={4} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Users size={17} /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Family overview</p>
                <h2 className="mt-0.5 text-sm font-bold text-slate-900">{members.length} members tracked</h2>
              </div>
            </div>
            <div className="mt-3 flex gap-3">
              <div className="flex-1 rounded-xl bg-emerald-50 px-3 py-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{goodCount}</p>
                <p className="text-[9px] font-medium text-emerald-700">Doing well</p>
              </div>
              <div className="flex-1 rounded-xl bg-amber-50 px-3 py-3 text-center">
                <p className="text-lg font-bold text-amber-600">{attentionCount}</p>
                <p className="text-[9px] font-medium text-amber-700">Needs attention</p>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 px-3 py-3 text-center">
                <p className="text-lg font-bold text-slate-600">{members.length}</p>
                <p className="text-[9px] font-medium text-slate-500">Total members</p>
              </div>
            </div>
          </div>
          {members.map((member) => {
            const config = statusConfig[member.status];
            const hasRefillNeeded = member.prescriptions.some((rx) => rx.status === 'Refill needed');
            return (
              <button key={member.id} onClick={() => onOpenMember(member.id)} className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{member.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{member.relation} · {member.age} yrs</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`flex items-center gap-1.5 rounded-full ${config.bg} px-2 py-1 text-[9px] font-bold ${config.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                    {hasRefillNeeded && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[8px] font-bold text-amber-600">
                        <TimerReset size={9} /> Refill needed
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {member.conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {member.conditions.map((condition) => (
                        <span key={condition} className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">{condition}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">No ongoing health issues</p>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="flex items-center gap-1 text-slate-500"><Pill size={11} /> {member.medicines} medicines</span>
                    <span className="flex items-center gap-1 text-slate-500"><HeartPulse size={11} /> {member.heart_rate} bpm</span>
                    <span className="flex items-center gap-1 text-slate-500"><CalendarDays size={11} /> {member.next_appointment}</span>
                  </div>
                </div>
                {member.medicines > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-500">
                      <span>Medicine tracking</span>
                      <span>{member.adherence}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div style={{ width: `${member.adherence}%` }} className={`h-2 rounded-full ${member.adherence >= 90 ? 'bg-emerald-500' : member.adherence >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    </div>
                  </div>
                )}
                <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400"><CheckCircle2 size={11} className="text-emerald-500" /> Last checkup: {member.last_checkup}</p>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-semibold text-indigo-600">
                  <span>View full details</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function FamilyMemberDetailView({ member, onClose }: { member: FamilyMember; onClose: () => void }) {
  useEscapeKey(onClose);
  const statusConfig: Record<FamilyMember['status'], { label: string; color: string; bg: string; dot: string }> = {
    good: { label: 'Doing well', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    attention: { label: 'Needs attention', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    critical: { label: 'Critical', color: 'text-rose-600', bg: 'bg-rose-50', dot: 'bg-rose-500' },
  };
  const config = statusConfig[member.status];

  const taken = member.doses.filter((d) => d.status === 'taken').length;
  const missed = member.doses.filter((d) => d.status === 'missed').length;
  const upcoming = member.doses.filter((d) => d.status === 'upcoming').length;
  const total = member.doses.length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 100;

  const doseStatusConfig: Record<DoseStatus, { label: string; icon: typeof Check; color: string; bg: string; border: string }> = {
    taken: { label: 'Taken', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    missed: { label: 'Missed', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    upcoming: { label: 'Upcoming', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              {member.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{member.name}</h2>
              <p className="text-[10px] text-slate-400">{member.relation} · {member.age} yrs · {member.blood_group}</p>
            </div>
          </div>
          <button aria-label="Close family member details" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex h-2 w-2 rounded-full ${config.dot}`} />
                  <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">{member.clinic}</span>
              </div>
              <div className="mt-3 flex gap-3">
                <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-slate-900">{member.heart_rate}</p>
                  <p className="text-[8px] text-slate-400">Heart rate (bpm)</p>
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-slate-900">{member.medicines}</p>
                  <p className="text-[8px] text-slate-400">Medicines</p>
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-slate-900">{member.adherence}%</p>
                  <p className="text-[8px] text-slate-400">On track</p>
                </div>
              </div>
              {member.conditions.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Health issues</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {member.conditions.map((condition) => (
                      <span key={condition} className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">{condition}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {total > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Tablets size={16} /></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's medicines</p>
                    <h2 className="mt-0.5 text-sm font-bold text-slate-900">{taken} of {total} taken · {pct}%</h2>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex h-2.5 gap-1 overflow-hidden rounded-full bg-slate-100">
                    <div style={{ width: `${(taken / total) * 100}%` }} className="h-2.5 rounded-full bg-emerald-500" />
                    {missed > 0 && <div style={{ width: `${(missed / total) * 100}%` }} className="h-2.5 rounded-full bg-rose-400" />}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 size={12} /> {taken} taken</span>
                    <span className="flex items-center gap-1 font-medium text-rose-500"><XCircle size={12} /> {missed} missed</span>
                    <span className="flex items-center gap-1 font-medium text-slate-400"><Clock size={12} /> {upcoming} upcoming</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {member.doses.map((dose) => {
                    const dConfig = doseStatusConfig[dose.status];
                    const DIcon = dConfig.icon;
                    return (
                      <div key={dose.id} className={`rounded-xl border ${dConfig.border} ${dConfig.bg} px-3 py-2.5`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-lg bg-white p-1.5 ${dConfig.color}`}><Pill size={14} /></span>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">{dose.medication} <span className="font-medium text-slate-500">({dose.amount})</span></p>
                              <p className="flex items-center gap-1 text-[9px] text-slate-400"><Clock size={10} /> {dose.time_label} · {dose.time}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-bold ${dConfig.color}`}>
                            <DIcon size={10} /> {dConfig.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {member.prescriptions.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Pill size={16} /></span>
                  <p className="text-xs font-bold text-slate-800">Prescriptions</p>
                </div>
                <div className="mt-3 space-y-2">
                  {member.prescriptions.map((rx) => (
                    <div key={rx.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{rx.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{rx.dose}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${rx.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{rx.status}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                        <span>{rx.days_remaining} days remaining</span>
                        <span>{Math.round((rx.days_remaining / 30) * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div style={{ width: `${Math.round((rx.days_remaining / 30) * 100)}%` }} className={`h-1.5 rounded-full ${rx.status === 'Refill needed' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {member.labs.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><ClipboardPlus size={16} /></span>
                  <p className="text-xs font-bold text-slate-800">Lab Reports</p>
                </div>
                <div className="mt-3 space-y-2">
                  {member.labs.map((lab) => (
                    <div key={lab.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{lab.name}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{lab.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">{lab.value}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-1 text-[9px] font-bold ${lab.status === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{lab.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><CalendarDays size={16} /></span>
                <p className="text-xs font-bold text-slate-800">Appointments</p>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Next checkup</p>
                    <p className="mt-1 text-[10px] text-slate-400">{member.clinic}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-600">{member.next_appointment}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400"><CheckCircle2 size={11} className="text-emerald-500" /> Last checkup: {member.last_checkup}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return (
    <nav className="grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">
      <span className="sr-only">Primary navigation</span>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-semibold transition ${activeTab === id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Icon size={18} strokeWidth={activeTab === id ? 2.3 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default App;
