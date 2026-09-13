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
