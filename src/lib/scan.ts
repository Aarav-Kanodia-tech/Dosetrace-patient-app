import { useCallback, useState } from 'react';
import { supabase } from './supabase';
import type { ExtractedMedicine, RefillInfo } from './ocr';

export type ScannedPrescriptionRow = {
  id: string;
  scanned_at: string;
  notes: string | null;
};

export type PrescriptionMedicineRow = {
  id: string;
  prescription_id: string;
  medication: string;
  amount: string;
  frequency: string;
  time_label: string;
  time: string;
  sort_order: number;
  added_to_doses: boolean;
};

export type ScannedRefillRow = {
  id: string;
  scanned_at: string;
  medication: string;
  batch_number: string;
  notes: string | null;
  confirmed: boolean;
};

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-medicine`;

export async function callScanFunction(image: string, mode: 'prescription' | 'refill'): Promise<{
  medicines?: ExtractedMedicine[];
  refill?: RefillInfo;
  error?: string;
}> {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ image, mode }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return { error: body.error ?? `Request failed (${response.status})` };
  }

  const data = await response.json();
  if (data.error) return { error: data.error };

  if (mode === 'prescription') {
    return { medicines: data.medicines ?? [] };
  } else {
    return {
      refill: {
        medication: data.medication ?? '',
        batchNumber: data.batchNumber ?? '',
        manufacturer: data.manufacturer ?? 'Not detected',
      },
    };
  }
}

export function useScannedRefills() {
  const [refills, setRefills] = useState<ScannedRefillRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRefills = useCallback(async () => {
    const { data, error } = await supabase
      .from('scanned_refills')
      .select('*')
      .order('scanned_at', { ascending: false });
    if (error) return;
    setRefills((data as ScannedRefillRow[]) ?? []);
  }, []);

  const saveRefill = useCallback(
    async (medication: string, batchNumber: string, notes?: string) => {
      const { data, error } = await supabase
        .from('scanned_refills')
        .insert({ medication, batch_number: batchNumber, notes, confirmed: true })
        .select()
        .maybeSingle();
      if (error) return null;
      await fetchRefills();
      return data as ScannedRefillRow | null;
    },
    [fetchRefills],
  );

  return { refills, loading, fetchRefills, saveRefill };
}

export function useSavePrescription() {
  const [saving, setSaving] = useState(false);

  const savePrescription = useCallback(
    async (
      medicines: Array<{
        medication: string;
        amount: string;
        frequency: string;
        time_label: string;
        time: string;
      }>,
      notes?: string,
    ): Promise<boolean> => {
      setSaving(true);
      try {
        const { data: rxData, error: rxError } = await supabase
          .from('scanned_prescriptions')
          .insert({ notes })
          .select()
          .maybeSingle();
        if (rxError || !rxData) return false;

        const prescriptionId = rxData.id;
        const maxSortOrder = await supabase
          .from('dose_records')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);

        let nextSort = 1;
        if (maxSortOrder.data && maxSortOrder.data.length > 0) {
          nextSort = (maxSortOrder.data[0] as { sort_order: number }).sort_order + 1;
        }

        const maxTxSort = await supabase
          .from('treatment_history')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);

        let nextTxSort = 1;
        if (maxTxSort.data && maxTxSort.data.length > 0) {
          nextTxSort = (maxTxSort.data[0] as { sort_order: number }).sort_order + 1;
        }

        for (const med of medicines) {
          const { data: medData, error: medError } = await supabase
            .from('prescription_medicines')
            .insert({
              prescription_id: prescriptionId,
              medication: med.medication,
              amount: med.amount,
              frequency: med.frequency,
              time_label: med.time_label,
              time: med.time,
              sort_order: nextSort,
            })
            .select()
            .maybeSingle();
          if (medError || !medData) continue;

          const doseId = `scan-${medData.id}`;
          await supabase.from('dose_records').insert({
            id: doseId,
            medication: med.medication,
            amount: med.amount,
            time: med.time,
            time_label: med.time_label,
            status: 'upcoming',
            sort_order: nextSort,
          });

          await supabase
            .from('prescription_medicines')
            .update({ added_to_doses: true })
            .eq('id', medData.id);

          const txId = `scan-tx-${medData.id}`;
          await supabase.from('treatment_history').insert({
            id: txId,
            treatment_name: `${med.medication} Treatment`,
            medication: med.medication,
            dosage: med.frequency,
            condition_treated: 'Prescribed via scan',
            doctor_name: 'Scanned Prescription',
            doctor_specialty: 'General',
            start_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            end_date: null,
            status: 'active',
            sort_order: nextTxSort,
          });

          nextSort += 1;
          nextTxSort += 1;
        }
        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { saving, savePrescription };
}
