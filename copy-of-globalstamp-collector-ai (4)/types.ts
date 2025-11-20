export enum Rarity {
  RARE = 'Nadir',
  SCARCE = 'Az Bulunur',
  COMMON = 'Yaygın'
}

export interface StampData {
  title: string;
  country: string;
  year: string;
  rarity: Rarity;
  valueUsd: string;
  description: string; // Turkish history/description
  catalogRef: string; // e.g., Scott #123
  conditionNote?: string; // Handling uncertainty/condition
  rarityReason?: string; // Specific reason for rarity (e.g., Withdrawn, Error, Unissued)
  groundingUrls: string[]; // Source links from Google Search
  imageBase64?: string; // Added for persistence
}

export interface CollectedStamp extends StampData {
  id: string;
  dateAdded: number;
}

export interface AnalysisState {
  status: 'idle' | 'analyzing_image' | 'searching_catalogs' | 'complete' | 'error';
  data: StampData | null;
  error?: string;
  imagePreview?: string;
}