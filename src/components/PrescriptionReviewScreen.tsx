import { useState } from 'react';
import {
  Check,
  X,
  Plus,
  Trash2,
  Pill,
  Clock,
  ScanLine,
  Save,
} from 'lucide-react';
import { useEscapeKey } from '@/lib/useEscapeKey';
import type { ExtractedMedicine } from '@/lib/ocr';

type MedicineDraft = ExtractedMedicine & {
  id: string;
};

type PrescriptionReviewScreenProps = {
  medicines: ExtractedMedicine[];
  photo: string;
  onSave: (
    medicines: Array<{
      medication: string;
      amount: string;
      frequency: string;
      time_label: string;
      time: string;
    }>,
  ) => void;
  onCancel: () => void;
  saving: boolean;
};

const FREQUENCY_OPTIONS = [
  { label: '1x Daily', timeLabel: 'Morning', time: '08:00' },
  { label: '2x Daily', timeLabel: 'Morning', time: '08:00' },
  { label: '3x Daily', timeLabel: 'Morning', time: '08:00' },
  { label: '1x Nightly', timeLabel: 'Night', time: '22:00' },
  { label: 'As needed', timeLabel: 'Day', time: 'As needed' },
];

export function PrescriptionReviewScreen({
  medicines,
  photo,
  onSave,
  onCancel,
  saving,
}: PrescriptionReviewScreenProps) {
  useEscapeKey(onCancel);
  const [drafts, setDrafts] = useState<MedicineDraft[]>(
    medicines.map((m, i) => ({ ...m, id: `draft-${i}-${Date.now()}` })),
  );

  function updateDraft(id: string, field: keyof MedicineDraft, value: string) {
    setDrafts((current) =>
      current.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  }

  function removeDraft(id: string) {
    setDrafts((current) => current.filter((d) => d.id !== id));
  }

  function addDraft() {
    setDrafts((current) => [
      ...current,
      {
        id: `draft-new-${Date.now()}`,
        name: '',
        amount: '',
        frequency: '1x Daily',
        time_label: 'Morning',
        time: '08:00',
      },
    ]);
  }

  function updateFrequency(id: string, frequency: string) {
    const option = FREQUENCY_OPTIONS.find((f) => f.label === frequency);
    if (!option) return;
    setDrafts((current) =>
      current.map((d) =>
        d.id === id
          ? { ...d, frequency, time_label: option.timeLabel, time: option.time }
          : d,
      ),
    );
  }

  function handleSave() {
    const valid = drafts.filter((d) => d.name.trim().length > 0);
    if (valid.length === 0) return;
    onSave(
      valid.map((d) => ({
        medication: d.name.trim(),
        amount: d.amount.trim() || '1 tablet',
        frequency: d.frequency,
        time_label: d.time_label,
        time: d.time,
      })),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ScanLine size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Review Medicines</h2>
              <p className="text-[10px] text-slate-400">
                {drafts.length} medicine{drafts.length === 1 ? '' : 's'} listed
              </p>
            </div>
          </div>
          <button
            aria-label="Close review"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src={photo} alt="Captured prescription" className="h-44 w-full object-cover" />
          </div>
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] leading-4 text-amber-800">
            Read the prescription photo above and add each medicine below. Enter the name, dosage, and schedule before saving to your daily tracker.
          </div>

          {drafts.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
              <p className="text-xs text-slate-400">No medicines added yet. Use the button below to add one from the photo.</p>
            </div>
          )}

          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1 rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                    <Pill size={14} />
                  </span>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => updateDraft(draft.id, 'name', e.target.value)}
                      placeholder="Medicine name"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draft.amount}
                        onChange={(e) => updateDraft(draft.id, 'amount', e.target.value)}
                        placeholder="Dosage (e.g. 500mg)"
                        className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white"
                      />
                      <select
                        value={draft.frequency}
                        onChange={(e) => updateFrequency(draft.id, e.target.value)}
                        className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white"
                      >
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock size={11} />
                      <span>
                        {draft.time_label} · {draft.time}
                      </span>
                    </div>
                  </div>
                  <button
                    aria-label="Remove medicine"
                    onClick={() => removeDraft(draft.id)}
                    className="mt-1 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addDraft}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            <Plus size={14} /> Add medicine manually
          </button>


        </div>

        <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || drafts.filter((d) => d.name.trim().length > 0).length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <Save size={14} className="animate-pulse" /> Saving…
              </>
            ) : (
              <>
                <Check size={14} /> Save to Daily Tracker
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
