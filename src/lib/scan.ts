import { useCallback, useState } from 'react';
import { supabase } from './supabase';

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

          nextSort += 1;
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
