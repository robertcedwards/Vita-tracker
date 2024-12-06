export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string;
  notes?: string;
  lastTaken?: string;
  barcode?: string;
  brand?: string;
  category?: string;
  intakeHistory: IntakeRecord[];
  reminder?: Reminder;
  nutritionalInfo?: NutritionalInfo;
  effectiveness?: EffectivenessRating[];
  tags?: string[];
  image?: string;
  verified?: boolean;
  apiData?: ExternalSupplementData;
}

export interface ExternalSupplementData {
  source: 'OpenFoodFacts' | 'UserContributed';
  productId?: string;
  lastUpdated: string;
  status: 'verified' | 'pending' | 'unverified';
}

export interface NutritionalInfo {
  servingSize: string;
  ingredients: string[];
  allergens?: string[];
  warnings?: string[];
  nutritionalValues?: {
    [key: string]: {
      amount: number;
      unit: string;
      dailyValue?: number;
    };
  };
}

export interface IntakeRecord {
  timestamp: string;
  taken: boolean;
  notes?: string;
  mood?: number;
  sideEffects?: string[];
}

export interface Reminder {
  enabled: boolean;
  times: string[];
  days: string[];
  notificationPreference?: 'push' | 'email' | 'both';
}

export interface EffectivenessRating {
  date: string;
  rating: number;
  notes?: string;
}

export interface DashboardStats {
  totalSupplements: number;
  takenToday: number;
  streak: number;
  compliance: number;
  mostConsistent: string[];
  needsRefill: string[];
}

export interface ScanResult {
  barcode: string;
  format: string;
  timestamp: string;
}

export interface ApiSupplementResponse {
  product: {
    product_name: string;
    brands?: string;
    image_url?: string;
    ingredients_text?: string;
    serving_size?: string;
    nutriments?: Record<string, number>;
    warnings?: string[];
    allergens?: string;
  };
  status: number;
  status_verbose: string;
}
