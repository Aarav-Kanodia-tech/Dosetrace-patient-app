import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  ChevronRight,
  Clock,
  XCircle,
  ClipboardPlus,
  HeartPulse,
  KeyRound,
  LockKeyhole,
  Pill,
  QrCode,
  Settings,
  ShieldCheck,
  Stethoscope,
  Tablets,
  TimerReset,
  UserRound,
  Users,
  Wifi,
  X,
} from 'lucide-react';

type Tab = 'home' | 'prescriptions' | 'labs' | 'family' | 'settings';
type SettingsSubpage = 'consent' | 'services' | 'security' | 'clinic' | 'doctor';
type DoseStatus = 'taken' | 'missed' | 'upcoming';

type Dose = {
  id: string;
  medication: string;
  amount: string;
  time: string;
  timeLabel: string;
  status: DoseStatus;
};

type LabResult = {
  name: string;
  value: string;
  reference: string;
  status: 'Normal' | 'Borderline';
};

type FamilyDose = {
  id: string;
  medication: string;
  amount: string;
  time: string;
  timeLabel: string;
  status: DoseStatus;
};

type FamilyPrescription = {
  name: string;
  dose: string;
  daysRemaining: number;
  status: 'Active' | 'Refill needed';
};

type FamilyLab = {
  name: string;
  value: string;
  reference: string;
  status: 'Normal' | 'Borderline';
};

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  age: number;
  conditions: string[];
  medicines: number;
  adherence: number;
  lastCheckup: string;
  status: 'good' | 'attention' | 'critical';
  heartRate: number;
  nextAppointment: string;
  bloodGroup: string;
  clinic: string;
  doses: FamilyDose[];
  prescriptions: FamilyPrescription[];
  labs: FamilyLab[];
};

const navItems: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'home', label: 'Home/Card', icon: HeartPulse },
  { id: 'prescriptions', label: 'Prescriptions', icon: Tablets },
  { id: 'labs', label: 'Lab Reports', icon: ClipboardPlus },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const initialDoses: Dose[] = [
  { id: 'd1', medication: 'Metformin', amount: '500mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
  { id: 'd2', medication: 'Lisinopril', amount: '10mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
  { id: 'd3', medication: 'Aspirin', amount: '81mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
  { id: 'd4', medication: 'Metformin', amount: '500mg', time: '20:00', timeLabel: 'Evening', status: 'missed' },
  { id: 'd5', medication: 'Atorvastatin', amount: '20mg', time: '22:00', timeLabel: 'Night', status: 'upcoming' },
];

const labResults: LabResult[] = [
  { name: 'HbA1c', value: '6.8%', reference: 'Ref: < 7.0% · Sep 3, 2026', status: 'Normal' },
  { name: 'Fasting Glucose', value: '104 mg/dL', reference: 'Ref: 70–99 · Sep 3, 2026', status: 'Borderline' },
  { name: 'LDL Cholesterol', value: '88 mg/dL', reference: 'Ref: < 100 · Aug 18, 2026', status: 'Normal' },
  { name: 'Creatinine', value: '0.92 mg/dL', reference: 'Ref: 0.7–1.2 · Aug 18, 2026', status: 'Normal' },
  { name: 'eGFR', value: '78 mL/min', reference: 'Ref: > 60 · Aug 18, 2026', status: 'Normal' },
];

const familyMembers: FamilyMember[] = [
  {
    id: 'f1',
    name: 'Margaret M.',
    relation: 'Mother',
    age: 68,
    conditions: ['Type 2 Diabetes', 'High Blood Pressure'],
    medicines: 4,
    adherence: 85,
    lastCheckup: 'Aug 28, 2026',
    status: 'attention',
    heartRate: 76,
    nextAppointment: 'Sep 25, 2026',
    bloodGroup: 'A+',
    clinic: 'Family Care Clinic',
    doses: [
      { id: 'm1d1', medication: 'Metformin', amount: '500mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
      { id: 'm1d2', medication: 'Metformin', amount: '500mg', time: '20:00', timeLabel: 'Evening', status: 'missed' },
      { id: 'm1d3', medication: 'Lisinopril', amount: '10mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
      { id: 'm1d4', medication: 'Glipizide', amount: '5mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
      { id: 'm1d5', medication: 'Atorvastatin', amount: '20mg', time: '22:00', timeLabel: 'Night', status: 'upcoming' },
    ],
    prescriptions: [
      { name: 'Metformin 500mg', dose: '2x Daily', daysRemaining: 12, status: 'Active' },
      { name: 'Lisinopril 10mg', dose: '1x Daily', daysRemaining: 5, status: 'Refill needed' },
      { name: 'Glipizide 5mg', dose: '1x Daily', daysRemaining: 20, status: 'Active' },
      { name: 'Atorvastatin 20mg', dose: '1x Nightly', daysRemaining: 15, status: 'Active' },
    ],
    labs: [
      { name: 'HbA1c', value: '7.2%', reference: 'Ref: < 7.0% · Aug 28, 2026', status: 'Borderline' },
      { name: 'Fasting Glucose', value: '128 mg/dL', reference: 'Ref: 70–99 · Aug 28, 2026', status: 'Borderline' },
      { name: 'LDL Cholesterol', value: '95 mg/dL', reference: 'Ref: < 100 · Aug 28, 2026', status: 'Normal' },
    ],
  },
  {
    id: 'f2',
    name: 'Robert M.',
    relation: 'Father',
    age: 71,
    conditions: ['High Blood Pressure'],
    medicines: 2,
    adherence: 100,
    lastCheckup: 'Sep 2, 2026',
    status: 'good',
    heartRate: 68,
    nextAppointment: 'Oct 15, 2026',
    bloodGroup: 'O+',
    clinic: 'Heart Care Center',
    doses: [
      { id: 'm2d1', medication: 'Lisinopril', amount: '20mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
      { id: 'm2d2', medication: 'Amlodipine', amount: '5mg', time: '08:00', timeLabel: 'Morning', status: 'taken' },
    ],
    prescriptions: [
      { name: 'Lisinopril 20mg', dose: '1x Daily', daysRemaining: 18, status: 'Active' },
      { name: 'Amlodipine 5mg', dose: '1x Daily', daysRemaining: 22, status: 'Active' },
    ],
    labs: [
      { name: 'LDL Cholesterol', value: '82 mg/dL', reference: 'Ref: < 100 · Sep 2, 2026', status: 'Normal' },
      { name: 'Creatinine', value: '1.0 mg/dL', reference: 'Ref: 0.7–1.2 · Sep 2, 2026', status: 'Normal' },
    ],
  },
  {
    id: 'f3',
    name: 'Sarah M.',
    relation: 'Sister',
    age: 34,
    conditions: ['Asthma'],
    medicines: 1,
    adherence: 90,
    lastCheckup: 'Jul 10, 2026',
    status: 'good',
    heartRate: 72,
    nextAppointment: 'Nov 5, 2026',
    bloodGroup: 'B+',
    clinic: 'City Health Clinic',
    doses: [
      { id: 'm3d1', medication: 'Albuterol', amount: '90mcg', time: 'As needed', timeLabel: 'Day', status: 'upcoming' },
    ],
    prescriptions: [
      { name: 'Albuterol Inhaler 90mcg', dose: 'As needed', daysRemaining: 30, status: 'Active' },
    ],
    labs: [
      { name: 'Spirometry FEV1', value: '2.8 L', reference: 'Ref: > 2.5 · Jul 10, 2026', status: 'Normal' },
    ],
  },
  {
    id: 'f4',
    name: 'Ethan M.',
    relation: 'Brother',
    age: 29,
    conditions: [],
    medicines: 0,
    adherence: 100,
    lastCheckup: 'Sep 8, 2026',
    status: 'good',
    heartRate: 65,
    nextAppointment: 'Dec 1, 2026',
    bloodGroup: 'O-',
    clinic: 'City Health Clinic',
    doses: [],
    prescriptions: [],
    labs: [
      { name: 'Complete Blood Count', value: 'Normal', reference: 'Ref: All normal · Sep 8, 2026', status: 'Normal' },
    ],
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [settingsSubpage, setSettingsSubpage] = useState<SettingsSubpage | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(true);
  const [consents, setConsents] = useState({ biometrics: true, rx: true, history: false });
  const [doses, setDoses] = useState<Dose[]>(initialDoses);
  const [dosageDetailOpen, setDosageDetailOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [familyDetailId, setFamilyDetailId] = useState<string | null>(null);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setSettingsSubpage(null);
  }

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  function handleScan() {
    if (isScanning) return;
    setCameraError(null);
    setCameraOpen(true);
  }

  function handleCapture() {
    setCameraOpen(false);
    setScanComplete(false);
    setIsScanning(true);
    window.setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 1500);
  }

  function toggleConsent(key: keyof typeof consents) {
    setConsents((current) => ({ ...current, [key]: !current[key] }));
  }

  function markDose(id: string) {
    setDoses((current) => current.map((dose) => (dose.id === id ? { ...dose, status: 'taken' as DoseStatus } : dose)));
  }

  const familyDetailMember = familyDetailId ? familyMembers.find((m) => m.id === familyDetailId) ?? null : null;

  return (
    <main className="min-h-screen bg-slate-200 px-3 py-6 text-slate-900 sm:px-5">
      <div className="mx-auto my-0 flex min-h-[844px] max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex-1 overflow-y-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Header onOpenNotifications={() => setNotificationsOpen(true)} />
          {activeTab === 'home' && (
            <HomeView
              isScanning={isScanning}
              scanComplete={scanComplete}
              handleScan={handleScan}
              onDismiss={() => setScanComplete(false)}
              privacyOpen={privacyOpen}
              setPrivacyOpen={setPrivacyOpen}
              consents={consents}
              toggleConsent={toggleConsent}
              doses={doses}
              onOpenDosageDetail={() => setDosageDetailOpen(true)}
            />
          )}
          {activeTab === 'prescriptions' && <PrescriptionsView onBack={() => selectTab('home')} />}
          {activeTab === 'labs' && <LabsView onBack={() => selectTab('home')} />}
          {activeTab === 'family' && <FamilyView onBack={() => selectTab('home')} onOpenMember={(id) => setFamilyDetailId(id)} />}
          {activeTab === 'settings' && (settingsSubpage ? <SettingsSubpageView page={settingsSubpage} onBack={() => setSettingsSubpage(null)} /> : <SettingsView consents={consents} onBack={() => selectTab('home')} onOpen={setSettingsSubpage} />)}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={selectTab} />
      </div>
      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} onCapture={handleCapture} error={cameraError} setError={setCameraError} />}
      {dosageDetailOpen && <DosageDetailView doses={doses} onMarkDose={markDose} onClose={() => setDosageDetailOpen(false)} />}
      {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
      {familyDetailMember && <FamilyMemberDetailView member={familyDetailMember} onClose={() => setFamilyDetailId(null)} />}
    </main>
  );
}

function Header({ onOpenNotifications }: { onOpenNotifications: () => void }) {
  return (
    <header className="flex items-center justify-between py-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Welcome back</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">My Health <span className="ml-1 rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-600">ID: #PX-9921</span></h1>
      </div>
      <button aria-label="Open medicine reminders" onClick={onOpenNotifications} className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <Bell size={18} strokeWidth={1.8} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      </button>
    </header>
  );
}

function HomeView({
  isScanning,
  scanComplete,
  handleScan,
  onDismiss,
  privacyOpen,
  setPrivacyOpen,
  consents,
  toggleConsent,
  doses,
  onOpenDosageDetail,
}: {
  isScanning: boolean;
  scanComplete: boolean;
  handleScan: () => void;
  onDismiss: () => void;
  privacyOpen: boolean;
  setPrivacyOpen: (value: boolean) => void;
  consents: { biometrics: boolean; rx: boolean; history: boolean };
  toggleConsent: (key: 'biometrics' | 'rx' | 'history') => void;
  doses: Dose[];
  onOpenDosageDetail: () => void;
}) {
  return (
    <div className="space-y-4">
      <HealthCard />
      <DosageTrackerCard doses={doses} onClick={onOpenDosageDetail} />
      <section>
        <button onClick={handleScan} disabled={isScanning} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-wait disabled:bg-emerald-600">
          {isScanning ? <TimerReset className="animate-spin" size={19} /> : <Camera size={19} />}
          <span>{isScanning ? 'Processing refill photo...' : 'Scan refill'}</span>
          {!isScanning && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Open Camera</span>}
        </button>
        {scanComplete && <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs leading-5 text-emerald-800"><Check className="mt-0.5 shrink-0" size={15} /><p><strong>Scan refill confirmed:</strong> Batch #MF-2026-X. Supply start updated for your care team.</p><button aria-label="Dismiss confirmation" onClick={onDismiss} className="ml-auto text-emerald-500"><X size={14} /></button></div>}
      </section>
      <FollowUpCard />
      <TelemetryCard />
      <ConsentCard open={privacyOpen} setOpen={setPrivacyOpen} consents={consents} toggleConsent={toggleConsent} />
    </div>
  );
}

function HealthCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 p-5 text-white shadow-lg shadow-indigo-900/20">
      <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full border-[20px] border-white/5" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2"><LockKeyhole size={15} /><p className="text-[11px] font-bold uppercase tracking-[0.12em]">DoseTrace Universal Health ID</p></div>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9px] font-semibold text-indigo-100"><ShieldCheck size={11} /> End-to-end encrypted</span>
      </div>
      <div className="relative mt-7 grid grid-cols-[1fr_auto] gap-4">
        <div className="space-y-4"><div><p className="text-[9px] uppercase tracking-wider text-indigo-200">Private Patient ID</p><p className="mt-1 font-mono text-sm font-semibold">PX-9921-ND</p></div><div className="flex gap-7"><div><p className="text-[9px] uppercase tracking-wider text-indigo-200">Blood Group</p><p className="mt-1 text-sm font-semibold">O+</p></div><div><p className="text-[9px] uppercase tracking-wider text-indigo-200">Active Clinic</p><p className="mt-1 max-w-[150px] text-xs font-medium leading-4">Outpatient Cardiology Unit</p></div></div></div>
        <div className="flex flex-col items-center justify-center"><div className="rounded-xl bg-white p-2"><QrCode size={56} className="text-slate-900" strokeWidth={1.6} /></div><p className="mt-2 max-w-[76px] text-center text-[8px] leading-3 text-indigo-100">Scan at chemist/clinic for instant Rx sync</p></div>
      </div>
      <div className="relative mt-5 flex items-center gap-2 border-t border-white/15 pt-3 text-[10px] font-medium text-indigo-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.15)]" /> Sharing permissions active <span className="text-indigo-300">•</span> 3 services connected</div>
    </section>
  );
}

function FollowUpCard() {
  return <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><CalendarDays size={16} /></span><h2 className="text-xs font-bold text-slate-800">Schedule & Doctor Follow-up</h2></div><div className="mt-3 rounded-xl bg-slate-50 px-3 py-3"><div className="flex justify-between"><div><p className="text-xs font-bold text-slate-800">Cardiology Follow-up</p><p className="mt-1 text-[10px] text-slate-400">Dr. Aisha Okonkwo · Cardiology</p></div><div className="text-right"><p className="text-xs font-bold text-indigo-600">Oct 20</p><p className="mt-1 font-mono text-[10px] text-slate-400">10:30 AM</p></div></div></div><p className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-emerald-600"><TimerReset size={13} /> Synced with your medicine supply</p></section>;
}

function TelemetryCard() {
  return <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="rounded-lg bg-rose-50 p-2 text-rose-500"><HeartPulse size={17} /></span><h2 className="text-xs font-bold text-slate-800">Health Tracking</h2></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">Live</span></div><div className="mt-3 flex items-center justify-between rounded-xl bg-rose-50/70 px-3 py-3"><div><p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Apple HealthKit Connected</p><p className="mt-1 text-xl font-bold tracking-tight text-slate-900">71 <span className="text-xs font-medium text-slate-500">bpm</span></p><p className="text-[10px] text-slate-500">Resting Heart Rate: Normal</p></div><Activity size={58} strokeWidth={1.5} className="text-rose-400" /></div><p className="mt-3 text-[10px] text-slate-400">Automatic tracking is on. No manual checklists needed.</p></section>;
}

function ConsentCard({ open, setOpen, consents, toggleConsent }: { open: boolean; setOpen: (value: boolean) => void; consents: { biometrics: boolean; rx: boolean; history: boolean }; toggleConsent: (key: 'biometrics' | 'rx' | 'history') => void }) {
  return <section className="rounded-2xl border border-slate-100 bg-white shadow-sm"><button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-4 text-left"><span className="flex items-center gap-2"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><KeyRound size={16} /></span><span className="text-xs font-bold text-slate-800">Privacy & Sharing</span></span><ChevronRight size={16} className={`text-slate-400 transition ${open ? 'rotate-90' : ''}`} /></button>{open && <div className="px-4 pb-3"> <ConsentRow label="Share health data with doctor" detail="Heart rate and activity" checked={consents.biometrics} onChange={() => toggleConsent('biometrics')} /><ConsentRow label="Sync chemist 'Rx Served' events" detail="Prescription data from WONDRx" checked={consents.rx} onChange={() => toggleConsent('rx')} /><ConsentRow label="Share history across clinics" detail="Sharing your history across clinics" checked={consents.history} onChange={() => toggleConsent('history')} /></div>}</section>;
}

function ConsentRow({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: () => void }) {
  return <div className="flex items-center justify-between border-t border-slate-100 py-3 first:border-t-0"><div><p className="text-[11px] font-semibold text-slate-700">{label}</p><p className="mt-0.5 text-[9px] text-slate-400">{detail}</p></div><button role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} /></button></div>;
}

function PrescriptionsView({ onBack }: { onBack: () => void }) {
  const prescriptions = [['Metformin 500mg', '2x Daily', '18 days remaining', '60%', 'Active'], ['Lisinopril 10mg', '1x Daily', '7 days remaining', '23%', 'Active'], ['Atorvastatin 20mg', '1x Nightly', '2 days remaining', '7%', 'Refill needed'], ['Aspirin 81mg', '1x Daily', '24 days remaining', '80%', 'Active']];
  return <PageShell title="Prescriptions" subtitle="Synced via WONDRx digital prescription" onBack={onBack}><div className="space-y-3">{prescriptions.map(([name, dose, remaining, width, status]) => <div key={name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-500"><Pill size={16} /></span><div><p className="text-xs font-bold text-slate-800">{name}</p><p className="mt-0.5 text-[10px] text-slate-400">{dose}</p></div></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{status}</span></div><div className="mt-3 flex justify-between font-mono text-[10px] text-slate-400"><span>{remaining}</span><span>{width}</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div style={{ width }} className={`h-1.5 rounded-full ${status === 'Refill needed' ? 'bg-amber-500' : 'bg-indigo-500'}`} /></div></div>)}</div></PageShell>;
}

function LabsView({ onBack }: { onBack: () => void }) {
  return <PageShell title="Lab Reports" subtitle="Most recent panel · Outpatient Cardiology Unit" onBack={onBack}><div className="space-y-3">{labResults.map((result) => <div key={result.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm"><div><p className="text-xs font-bold text-slate-800">{result.name}</p><p className="mt-1 text-[10px] text-slate-400">{result.reference}</p></div><div className="text-right"><p className="text-xs font-bold text-slate-900">{result.value}</p><span className={`mt-1 inline-block rounded-full px-2 py-1 text-[9px] font-bold ${result.status === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{result.status}</span></div></div>)}</div></PageShell>;
}

function SettingsView({ consents, onBack, onOpen }: { consents: { biometrics: boolean; rx: boolean; history: boolean }; onBack: () => void; onOpen: (page: SettingsSubpage) => void }) {
  return <PageShell title="Settings" subtitle="Your health data, your choices" onBack={onBack}><div className="space-y-4"><div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">JM</div><p className="mt-3 text-sm font-bold">Jordan M.</p><p className="mt-1 font-mono text-[10px] text-slate-400">ID: #PX-9921</p></div><SettingsGroup title="Privacy overview"><SettingsItem icon={ShieldCheck} label="Sharing permissions" value={`${Object.values(consents).filter(Boolean).length} of 3 active`} onClick={() => onOpen('consent')} /><SettingsItem icon={Wifi} label="Connected services" value="3 streams" onClick={() => onOpen('services')} /><SettingsItem icon={LockKeyhole} label="Security" value="End-to-end encrypted" onClick={() => onOpen('security')} /></SettingsGroup><SettingsGroup title="Care team"><SettingsItem icon={Stethoscope} label="Outpatient Cardiology Unit" value="Active clinic" onClick={() => onOpen('clinic')} /><SettingsItem icon={UserRound} label="Dr. Aisha Okonkwo" value="Cardiology" onClick={() => onOpen('doctor')} /></SettingsGroup></div></PageShell>;
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) { return <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>{children}</div>; }
function SettingsItem({ icon: Icon, label, value, onClick }: { icon: typeof ShieldCheck; label: string; value: string; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 first:border-t-0"><Icon size={16} className="text-indigo-500" /><p className="flex-1 text-xs font-semibold text-slate-700">{label}</p><span className="text-[10px] text-slate-400">{value}</span><ChevronRight size={14} className="text-slate-300" /></button>; }
function PageShell({ title, subtitle, children, onBack }: { title: string; subtitle: string; children: ReactNode; onBack: () => void }) { return <div className="pb-4"><div className="border-b border-slate-200 pb-4"><div className="flex items-center gap-3"><button aria-label={`Back from ${title}`} onClick={onBack} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100"><ArrowRight size={16} className="rotate-180" /></button><h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2></div><p className="mt-4 text-[10px] text-slate-400">{subtitle}</p></div><div className="mt-4">{children}</div></div>; }

function SettingsSubpageView({ page, onBack }: { page: SettingsSubpage; onBack: () => void }) {
  const content: Record<SettingsSubpage, { title: string; subtitle: string; heading: string; detail: string }> = {
    consent: { title: 'Sharing permissions', subtitle: 'Control what health data you share', heading: 'Your active permissions', detail: 'Review and adjust the three sharing settings connected to DoseTrace. Changes apply right away to future data sharing.' },
    services: { title: 'Connected services', subtitle: 'Apps and devices linked to DoseTrace', heading: '3 services connected', detail: 'WONDRx Smart Pen, Apple HealthKit, and your clinic are currently connected for shared care.' },
    security: { title: 'Security', subtitle: 'How your health data stays protected', heading: 'End-to-end encrypted', detail: 'Your Universal Health ID and connected health data use end-to-end encrypted transfer and anonymized patient identifiers.' },
    clinic: { title: 'Outpatient Cardiology Unit', subtitle: 'Active clinic', heading: 'Your care team', detail: 'This clinic can access the care data you have shared, including your medicines, health tracking, and lab reports.' },
    doctor: { title: 'Dr. Aisha Okonkwo', subtitle: 'Cardiology · Outpatient Cardiology Unit', heading: 'Next appointment · Oct 20', detail: 'Your routine follow-up is scheduled for 10:30 AM. Your current medicine supply and latest health data will be ready for review.' },
  };
  const details = content[page];
  return <PageShell title={details.title} subtitle={details.subtitle} onBack={onBack}><div className="space-y-3"><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck size={22} /></div><h3 className="mt-4 text-sm font-bold text-slate-900">{details.heading}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{details.detail}</p></div><div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p><p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected and up to date</p></div></div></PageShell>;
}

type NotificationReminder = {
  id: string;
  medication: string;
  time: string;
  message: string;
  status: 'taken' | 'missed' | 'upcoming';
  refillDate: string;
};

const notificationReminders: NotificationReminder[] = [
  { id: 'r1', medication: 'Metformin 500mg', time: '8:00 AM', message: 'Morning dose reminder', status: 'taken', refillDate: 'Oct 18, 2026' },
  { id: 'r2', medication: 'Lisinopril 10mg', time: '8:00 AM', message: 'Morning dose reminder', status: 'taken', refillDate: 'Sep 25, 2026' },
  { id: 'r3', medication: 'Aspirin 81mg', time: '8:00 AM', message: 'Morning dose reminder', status: 'taken', refillDate: 'Oct 5, 2026' },
  { id: 'r4', medication: 'Metformin 500mg', time: '8:00 PM', message: 'Evening dose reminder', status: 'missed', refillDate: 'Oct 18, 2026' },
  { id: 'r5', medication: 'Atorvastatin 20mg', time: '10:00 PM', message: 'Night dose reminder', status: 'upcoming', refillDate: 'Sep 14, 2026' },
];

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const today = new Date('2026-09-12');

  const sortedReminders = [...notificationReminders].sort((a, b) => {
    const dateA = new Date(a.refillDate);
    const dateB = new Date(b.refillDate);
    return dateA.getTime() - dateB.getTime();
  });

  function daysUntilRefill(refillDate: string): number {
    const refill = new Date(refillDate);
    const diff = refill.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function autoStatus(reminder: NotificationReminder): 'taken' | 'missed' | 'upcoming' | 'refill-soon' {
    const days = daysUntilRefill(reminder.refillDate);
    if (days <= 3) return 'refill-soon';
    return reminder.status;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-3 pt-20 backdrop-blur-sm sm:pt-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
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
            const days = daysUntilRefill(reminder.refillDate);
            const isTaken = status === 'taken';
            const isMissed = status === 'missed';
            const isRefillSoon = status === 'refill-soon';
            return (
              <div key={reminder.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${isTaken ? 'border-emerald-100 bg-emerald-50/70' : isMissed ? 'border-rose-100 bg-rose-50/70' : 'border-amber-100 bg-amber-50/70'}`}>
                <span className={`rounded-xl bg-white p-2 ${isTaken ? 'text-emerald-600' : isMissed ? 'text-rose-500' : 'text-amber-500'}`}><Pill size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{reminder.medication}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{reminder.message} · {reminder.time}</p>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Tablets size={18} /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Medicine Routine</h2>
              <p className="text-[10px] text-slate-400">Sep 11, 2026</p>
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
              return (
                <div key={dose.id} className={`rounded-2xl border ${config.border} ${config.bg} p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg bg-white p-2 ${config.color}`}><Pill size={16} /></span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{dose.medication} <span className="font-medium text-slate-500">({dose.amount})</span></p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400"><Clock size={11} /> {dose.timeLabel} · {dose.time}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold ${config.color}`}>
                      <StatusIcon size={11} /> {config.label}
                    </span>
                  </div>
                  {dose.status !== 'taken' && (
                    <button onClick={() => onMarkDose(dose.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.99]">
                      <Check size={14} /> Mark as taken
                    </button>
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

function CameraModal({ onClose, onCapture, error, setError }: { onClose: () => void; onCapture: () => void; error: string | null; setError: (value: string | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not supported in this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to access camera.';
        setError(message);
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [setError]);

  function handleClose() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <Camera size={18} className="text-emerald-400" />
            <span className="text-sm font-bold">Scan Refill — Live Camera</span>
          </div>
          <button aria-label="Close camera" onClick={handleClose} className="rounded-full bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="relative aspect-[3/4] w-full bg-slate-950">
          <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${ready ? 'opacity-100' : 'opacity-0'}`} />
          {!ready && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <TimerReset className="animate-spin" size={28} />
              <p className="text-xs font-medium">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
              <CircleAlert size={28} className="text-amber-400" />
              <p className="text-xs font-medium">{error}</p>
              <p className="text-[10px] text-slate-500">Allow camera access in your browser to continue.</p>
            </div>
          )}
          {ready && !error && (
            <>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-44 w-44 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_2000px_rgba(2,6,23,0.45)]" />
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-emerald-300">
                Align blister pack within the frame
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button onClick={handleClose} className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700">
            Cancel
          </button>
          <button onClick={onCapture} disabled={!ready || !!error} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">
            <Camera size={15} /> Capture
          </button>
        </div>
      </div>
    </div>
  );
}

function FamilyView({ onBack, onOpenMember }: { onBack: () => void; onOpenMember: (id: string) => void }) {
  const statusConfig: Record<FamilyMember['status'], { label: string; color: string; bg: string; dot: string }> = {
    good: { label: 'Doing well', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    attention: { label: 'Needs attention', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    critical: { label: 'Critical', color: 'text-rose-600', bg: 'bg-rose-50', dot: 'bg-rose-500' },
  };

  const goodCount = familyMembers.filter((m) => m.status === 'good').length;
  const attentionCount = familyMembers.filter((m) => m.status === 'attention').length;

  return (
    <PageShell title="Family Status" subtitle="Health overview for your family members" onBack={onBack}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Users size={17} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Family overview</p>
              <h2 className="mt-0.5 text-sm font-bold text-slate-900">{familyMembers.length} members tracked</h2>
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
              <p className="text-lg font-bold text-slate-600">{familyMembers.length}</p>
              <p className="text-[9px] font-medium text-slate-500">Total members</p>
            </div>
          </div>
        </div>
        {familyMembers.map((member) => {
          const config = statusConfig[member.status];
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
                <span className={`flex items-center gap-1.5 rounded-full ${config.bg} px-2 py-1 text-[9px] font-bold ${config.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                  {config.label}
                </span>
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
                  <span className="flex items-center gap-1 text-slate-500"><HeartPulse size={11} /> {member.heartRate} bpm</span>
                  <span className="flex items-center gap-1 text-slate-500"><CalendarDays size={11} /> {member.nextAppointment}</span>
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
              <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400"><CheckCircle2 size={11} className="text-emerald-500" /> Last checkup: {member.lastCheckup}</p>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-semibold text-indigo-600">
                <span>View full details</span>
                <ChevronRight size={14} />
              </div>
            </button>
          );
        })}
      </div>
    </PageShell>
  );
}

function FamilyMemberDetailView({ member, onClose }: { member: FamilyMember; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              {member.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{member.name}</h2>
              <p className="text-[10px] text-slate-400">{member.relation} · {member.age} yrs · {member.bloodGroup}</p>
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
                  <p className="text-sm font-bold text-slate-900">{member.heartRate}</p>
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
                              <p className="flex items-center gap-1 text-[9px] text-slate-400"><Clock size={10} /> {dose.timeLabel} · {dose.time}</p>
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
                    <div key={rx.name} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{rx.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{rx.dose}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${rx.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{rx.status}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                        <span>{rx.daysRemaining} days remaining</span>
                        <span>{Math.round((rx.daysRemaining / 30) * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div style={{ width: `${Math.round((rx.daysRemaining / 30) * 100)}%` }} className={`h-1.5 rounded-full ${rx.status === 'Refill needed' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
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
                    <div key={lab.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
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
                    <p className="text-xs font-bold text-indigo-600">{member.nextAppointment}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400"><CheckCircle2 size={11} className="text-emerald-500" /> Last checkup: {member.lastCheckup}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return <nav className="grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur"><span className="sr-only">Primary navigation</span>{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-semibold transition ${activeTab === id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Icon size={18} strokeWidth={activeTab === id ? 2.3 : 1.8} /><span>{label}</span></button>)}</nav>;
}

export default App;
