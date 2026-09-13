import { useState } from 'react';
import { Check, X, PackageCheck, Save } from 'lucide-react';
import { useEscapeKey } from '@/lib/useEscapeKey';

type RefillReviewScreenProps = {
  photo: string;
  onSave: (medication: string, batchNumber: string) => void;
  onCancel: () => void;
  saving: boolean;
};

export function RefillReviewScreen({ photo, onSave, onCancel, saving }: RefillReviewScreenProps) {
  useEscapeKey(onCancel);
  const [medication, setMedication] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  function handleSave() {
    if (!medication.trim()) return;
    onSave(medication.trim(), batchNumber.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <PackageCheck size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Confirm Refill</h2>
              <p className="text-[10px] text-slate-400">Enter details from the label</p>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src={photo} alt="Captured refill" className="h-48 w-full object-cover" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Medicine name
              </label>
              <input
                type="text"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="e.g. Metformin 500mg"
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Batch / Lot number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BN12345"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[10px] leading-4 text-emerald-800">
            Review the photo above and enter the medicine name and batch number printed on the label.
          </div>
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
            disabled={saving || !medication.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <Save size={14} className="animate-pulse" /> Saving…
              </>
            ) : (
              <>
                <Check size={14} /> Confirm & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
