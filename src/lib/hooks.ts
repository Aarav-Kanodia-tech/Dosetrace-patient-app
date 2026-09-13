import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type DoseStatus = 'taken' | 'missed' | 'upcoming';

export type Dose = {
  id: string;
  medication: string;
  amount: string;
  time: string;
  time_label: string;
  status: DoseStatus;
  sort_order: number;
};

export type ConsentSettings = {
  id: string;
  biometrics: boolean;
  rx: boolean;
  history: boolean;
};

export type FamilyMemberRow = {
  id: string;
  name: string;
  relation: string;
  age: number;
  conditions: string[];
  medicines: number;
  adherence: number;
  last_checkup: string;
  status: 'good' | 'attention' | 'critical';
  heart_rate: number;
  next_appointment: string;
  blood_group: string;
  clinic: string;
};

export type FamilyDoseRow = {
  id: string;
  member_id: string;
  medication: string;
  amount: string;
  time: string;
  time_label: string;
  status: DoseStatus;
  sort_order: number;
};

export type FamilyPrescriptionRow = {
  id: string;
  member_id: string;
  name: string;
  dose: string;
  days_remaining: number;
  status: 'Active' | 'Refill needed';
  sort_order: number;
};

export type FamilyLabRow = {
  id: string;
  member_id: string;
  name: string;
  value: string;
  reference: string;
  status: 'Normal' | 'Borderline';
  sort_order: number;
};

export type FamilyData = {
  members: FamilyMemberRow[];
  doses: FamilyDoseRow[];
  prescriptions: FamilyPrescriptionRow[];
  labs: FamilyLabRow[];
};

export function useDoses() {
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoses = useCallback(async () => {
    const { data, error } = await supabase
      .from('dose_records')
      .select('*')
      .order('sort_order');
    if (error) return;
    setDoses(data as Dose[]);
  }, []);

  useEffect(() => {
    fetchDoses().finally(() => setLoading(false));
  }, [fetchDoses]);

  const markDose = useCallback(async (id: string) => {
    setDoses((current) =>
      current.map((dose) => (dose.id === id ? { ...dose, status: 'taken' as DoseStatus } : dose)),
    );
    await supabase.from('dose_records').update({ status: 'taken' }).eq('id', id);
  }, []);

  return { doses, loading, markDose, refetch: fetchDoses };
}

export function useConsents() {
  const [consents, setConsents] = useState<ConsentSettings>({
    id: 'default',
    biometrics: true,
    rx: true,
    history: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchConsents = useCallback(async () => {
    const { data } = await supabase
      .from('consent_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (data) setConsents(data as ConsentSettings);
  }, []);

  useEffect(() => {
    fetchConsents().finally(() => setLoading(false));
  }, [fetchConsents]);

  const toggleConsent = useCallback(
    async (key: 'biometrics' | 'rx' | 'history') => {
      setConsents((current) => {
        const updated = { ...current, [key]: !current[key] };
        supabase.from('consent_settings').update({ [key]: updated[key] }).eq('id', 'default');
        return updated;
      });
    },
    [],
  );

  return { consents, loading, toggleConsent };
}

export type TreatmentHistoryRow = {
  id: string;
  treatment_name: string;
  medication: string;
  dosage: string;
  condition_treated: string;
  doctor_name: string;
  doctor_specialty: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed';
  sort_order: number;
};

export type TreatmentSharingRow = {
  id: string;
  treatment_id: string;
  doctor_name: string;
  doctor_specialty: string;
  is_prescribing_doctor: boolean;
  hidden: boolean;
  sort_order: number;
};

export type VitalRow = {
  id: string;
  vital_type: string;
  value: string;
  unit: string;
  date_recorded: string;
  sort_order: number;
};

export type HistoryData = {
  treatments: TreatmentHistoryRow[];
  sharing: TreatmentSharingRow[];
  vitals: VitalRow[];
};

export function useHistoryData() {
  const [data, setData] = useState<HistoryData>({
    treatments: [],
    sharing: [],
    vitals: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [txRes, shareRes, vitalsRes] = await Promise.all([
      supabase.from('treatment_history').select('*').order('sort_order'),
      supabase.from('treatment_sharing').select('*').order('sort_order'),
      supabase.from('vitals').select('*').order('sort_order'),
    ]);

    setData({
      treatments: (txRes.data ?? []) as TreatmentHistoryRow[],
      sharing: (shareRes.data ?? []) as TreatmentSharingRow[],
      vitals: (vitalsRes.data ?? []) as VitalRow[],
    });
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const toggleSharing = useCallback(async (sharingId: string, hidden: boolean) => {
    setData((current) => ({
      ...current,
      sharing: current.sharing.map((s) =>
        s.id === sharingId ? { ...s, hidden } : s,
      ),
    }));
    await supabase.from('treatment_sharing').update({ hidden }).eq('id', sharingId);
  }, []);

  return { data, loading, refetch: fetchAll, toggleSharing };
}

export function useFamilyData() {
  const [data, setData] = useState<FamilyData>({
    members: [],
    doses: [],
    prescriptions: [],
    labs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [membersRes, dosesRes, rxRes, labsRes] = await Promise.all([
      supabase.from('family_members').select('*').order('id'),
      supabase.from('family_doses').select('*').order('sort_order'),
      supabase.from('family_prescriptions').select('*').order('sort_order'),
      supabase.from('family_labs').select('*').order('sort_order'),
    ]);

    setData({
      members: (membersRes.data ?? []) as FamilyMemberRow[],
      doses: (dosesRes.data ?? []) as FamilyDoseRow[],
      prescriptions: (rxRes.data ?? []) as FamilyPrescriptionRow[],
      labs: (labsRes.data ?? []) as FamilyLabRow[],
    });
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  return { data, loading, refetch: fetchAll };
}
