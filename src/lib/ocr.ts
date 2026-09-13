import Tesseract from 'tesseract.js';

export type ExtractedMedicine = {
  name: string;
  amount: string;
  frequency: string;
  time_label: string;
  time: string;
};

export type RefillInfo = {
  medication: string;
  batchNumber: string;
  manufacturer: string;
};

export type ScanResult = {
  rawText: string;
  medicines: ExtractedMedicine[];
};

const FREQUENCY_PATTERNS: Array<{ regex: RegExp; frequency: string; timeLabel: string; time: string }> = [
  { regex: /twice\s*daily|2\s*times?\s*(a\s*)?day|b\.?i\.?d\.?/i, frequency: '2x Daily', timeLabel: 'Morning', time: '08:00' },
  { regex: /three\s*times?\s*(a\s*)?day|3\s*times?\s*(a\s*)?day|t\.?i\.?d\.?/i, frequency: '3x Daily', timeLabel: 'Morning', time: '08:00' },
  { regex: /once\s*daily|1\s*times?\s*(a\s*)?day|daily|q\.?d\.?/i, frequency: '1x Daily', timeLabel: 'Morning', time: '08:00' },
  { regex: /at\s*night|nightly|h\.?s\.?|q\.?h\.?s\.?/i, frequency: '1x Nightly', timeLabel: 'Night', time: '22:00' },
  { regex: /every\s*morning|q\.?a\.?m\.?/i, frequency: '1x Daily', timeLabel: 'Morning', time: '08:00' },
  { regex: /every\s*evening|q\.?p\.?m\.?/i, frequency: '1x Daily', timeLabel: 'Evening', time: '20:00' },
  { regex: /as\s*needed|prn/i, frequency: 'As needed', timeLabel: 'Day', time: 'As needed' },
];

const TIME_OF_DAY_PATTERNS: Array<{ regex: RegExp; timeLabel: string; time: string }> = [
  { regex: /\bmorning\b/i, timeLabel: 'Morning', time: '08:00' },
  { regex: /\bnoon\b/i, timeLabel: 'Noon', time: '12:00' },
  { regex: /\bafternoon\b/i, timeLabel: 'Afternoon', time: '14:00' },
  { regex: /\bevening\b/i, timeLabel: 'Evening', time: '20:00' },
  { regex: /\bnight\b|\bbedtime\b/i, timeLabel: 'Night', time: '22:00' },
];

const MEDICATION_INDICATORS = /\b(\d+\s*(?:mg|mcg|ml|mg\/ml|IU|units?|tabs?|caps?|drops?|puffs?)\b)/i;
const DOSAGE_PATTERN = /\d+\s*(?:mg|mcg|ml|mg\/ml|IU|units?|tabs?|caps?|drops?|puffs?)/i;
const BATCH_PATTERN = /(?:batch|lot|b\/?no\.?)\s*[:#]?\s*([A-Z0-9\-]{3,15})/i;

function parseFrequency(text: string): { frequency: string; timeLabel: string; time: string } {
  for (const pattern of FREQUENCY_PATTERNS) {
    if (pattern.regex.test(text)) {
      return { frequency: pattern.frequency, timeLabel: pattern.timeLabel, time: pattern.time };
    }
  }

  for (const pattern of TIME_OF_DAY_PATTERNS) {
    if (pattern.regex.test(text)) {
      return { frequency: '1x Daily', timeLabel: pattern.timeLabel, time: pattern.time };
    }
  }

  return { frequency: '1x Daily', timeLabel: 'Morning', time: '08:00' };
}

function isLikelyMedicineLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 120) return false;
  if (/^(patient|date|doctor|dr\.|clinic|hospital|rx\s*$|prescription|pharmacy|address|phone|fax|signature|refill|qty|quantity|sig:)/i.test(trimmed)) return false;
  if (/^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/.test(trimmed)) return false;
  if (MEDICATION_INDICATORS.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  return words.length >= 1 && words.length <= 8 && /^[A-Z]/.test(trimmed) && !/^(the|and|for|with|take|this)/i.test(trimmed);
}

function extractMedicineFromLine(line: string): ExtractedMedicine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const dosageMatch = trimmed.match(DOSAGE_PATTERN);
  const amount = dosageMatch ? dosageMatch[0].replace(/\s+/g, '') : '';

  const withoutDosage = trimmed.replace(DOSAGE_PATTERN, '').replace(/\s+/g, ' ').trim();

  const name = withoutDosage
    .replace(/^\d+[\.\)]\s*/, '')
    .replace(/^[-•*]\s*/, '')
    .replace(/\s*(tablet|capsule|inhaler|drops?|syrup|cream|ointment|injection)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!name || name.length < 2) return null;

  const { frequency, timeLabel, time } = parseFrequency(trimmed);

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount: amount || '1 tablet',
    frequency,
    time_label: timeLabel,
    time,
  };
}

export async function runOCR(imageData: string): Promise<string> {
  const result = await Tesseract.recognize(imageData, 'eng', {
    logger: () => undefined,
  });
  return result.data.text;
}

export function parsePrescriptionText(rawText: string): ExtractedMedicine[] {
  const lines = rawText.split(/\n+/);
  const medicines: ExtractedMedicine[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!isLikelyMedicineLine(line)) continue;
    const medicine = extractMedicineFromLine(line);
    if (!medicine) continue;
    const key = medicine.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    medicines.push(medicine);
  }

  return medicines;
}

export function parseRefillText(rawText: string): RefillInfo {
  const lines = rawText.split(/\n+/);

  let medication = '';
  let batchNumber = '';
  let manufacturer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const batchMatch = trimmed.match(BATCH_PATTERN);
    if (batchMatch && !batchNumber) {
      batchNumber = batchMatch[1];
      continue;
    }

    const dosageMatch = trimmed.match(DOSAGE_PATTERN);
    if (dosageMatch && !medication) {
      const name = trimmed
        .replace(DOSAGE_PATTERN, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/^[-•*]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (name.length > 1) {
        medication = name.charAt(0).toUpperCase() + name.slice(1);
      }
      continue;
    }

    if (!medication && isLikelyMedicineLine(trimmed)) {
      const extracted = extractMedicineFromLine(trimmed);
      if (extracted) {
        medication = extracted.name;
      }
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (/manufactured|mfg\.?|by|lab|pharma|pharmaceutical/i.test(trimmed) && !manufacturer) {
      manufacturer = trimmed.replace(/^(manufactured by|mfg\.?|by)\s*/i, '').trim();
      break;
    }
  }

  return {
    medication: medication || 'Unknown medicine',
    batchNumber: batchNumber || 'Not detected',
    manufacturer: manufacturer || 'Not detected',
  };
}

export async function scanPrescription(imageData: string): Promise<ScanResult> {
  const rawText = await runOCR(imageData);
  const medicines = parsePrescriptionText(rawText);
  return { rawText, medicines };
}

export async function scanRefill(imageData: string): Promise<{ rawText: string; refill: RefillInfo }> {
  const rawText = await runOCR(imageData);
  const refill = parseRefillText(rawText);
  return { rawText, refill };
}
