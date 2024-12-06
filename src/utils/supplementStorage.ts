import { Supplement, IntakeRecord } from '../types';
import { fetchSupplementInfo } from '../services/supplementApi';

const STORAGE_KEY = 'supplements';
const USER_PREFERENCES_KEY = 'supplement_preferences';

interface UserPreferences {
  defaultReminders: boolean;
  defaultFrequency: string;
  defaultTimeOfDay: string;
}

export const supplementStorage = {
  getAll: (): Supplement[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  add: async (supplement: Omit<Supplement, 'id'>): Promise<Supplement> => {
    const supplements = supplementStorage.getAll();
    let nutritionalInfo = supplement.nutritionalInfo;

    // If barcode exists, try to fetch data from API
    if (supplement.barcode) {
      const apiData = await fetchSupplementInfo(supplement.barcode);
      if (apiData) {
        nutritionalInfo = apiData;
      }
    }

    const newSupplement: Supplement = {
      ...supplement,
      id: crypto.randomUUID(),
      intakeHistory: [],
      nutritionalInfo,
      apiData: supplement.barcode ? {
        source: 'OpenFoodFacts' as const,
        productId: supplement.barcode,
        lastUpdated: new Date().toISOString(),
        status: nutritionalInfo ? 'verified' : 'unverified'
      } : undefined
    };
    
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...supplements, newSupplement])
    );
    
    return newSupplement;
  },

  update: async (id: string, updates: Partial<Supplement>): Promise<Supplement | null> => {
    const supplements = supplementStorage.getAll();
    const index = supplements.findIndex(s => s.id === id);
    
    if (index === -1) return null;

    // If barcode is being updated, fetch new data
    if (updates.barcode && updates.barcode !== supplements[index].barcode) {
      const apiData = await fetchSupplementInfo(updates.barcode);
      if (apiData) {
        updates.nutritionalInfo = apiData;
        updates.apiData = {
          source: 'OpenFoodFacts' as const,
          productId: updates.barcode,
          lastUpdated: new Date().toISOString(),
          status: 'verified'
        };
      }
    }
    
    const updated = {
      ...supplements[index],
      ...updates,
    };
    
    supplements[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(supplements));
    
    return updated;
  },

  delete: (id: string): boolean => {
    const supplements = supplementStorage.getAll();
    const filtered = supplements.filter(s => s.id !== id);
    
    if (filtered.length === supplements.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  logIntake: (id: string, record: Partial<IntakeRecord>): boolean => {
    const supplements = supplementStorage.getAll();
    const index = supplements.findIndex(s => s.id === id);
    
    if (index === -1) return false;
    
    const intakeRecord: IntakeRecord = {
      timestamp: new Date().toISOString(),
      taken: true,
      ...record,
    };
    
    supplements[index] = {
      ...supplements[index],
      lastTaken: intakeRecord.timestamp,
      intakeHistory: [
        intakeRecord,
        ...supplements[index].intakeHistory,
      ],
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(supplements));
    return true;
  },

  getUserPreferences: (): UserPreferences => {
    const data = localStorage.getItem(USER_PREFERENCES_KEY);
    return data ? JSON.parse(data) : {
      defaultReminders: true,
      defaultFrequency: 'Daily',
      defaultTimeOfDay: 'Morning'
    };
  },

  setUserPreferences: (preferences: Partial<UserPreferences>): void => {
    const currentPreferences = supplementStorage.getUserPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
  },

  refreshNutritionalInfo: async (id: string): Promise<boolean> => {
    const supplements = supplementStorage.getAll();
    const supplement = supplements.find(s => s.id === id);
    
    if (!supplement?.barcode || !supplement.apiData) return false;

    const apiData = await fetchSupplementInfo(supplement.barcode);
    if (!apiData) return false;

    return Boolean(supplementStorage.update(id, {
      nutritionalInfo: apiData,
      apiData: {
        source: supplement.apiData.source,
        productId: supplement.apiData.productId,
        lastUpdated: new Date().toISOString(),
        status: 'verified'
      }
    }));
  },

  calculateStats: () => {
    const supplements = supplementStorage.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalSupplements: supplements.length,
      takenToday: supplements.filter(s => 
        s.lastTaken?.startsWith(today)
      ).length,
      streak: calculateStreak(supplements),
      compliance: calculateCompliance(supplements),
      mostConsistent: findMostConsistent(supplements),
      needsRefill: [], // Implement refill detection logic
    };
  },
};

function calculateStreak(supplements: Supplement[]): number {
  // Basic implementation
  return supplements.filter(s => s.lastTaken).length;
}

function calculateCompliance(supplements: Supplement[]): number {
  if (supplements.length === 0) return 0;
  const takenCount = supplements.filter(s => s.lastTaken).length;
  return Math.round((takenCount / supplements.length) * 100);
}

function findMostConsistent(supplements: Supplement[]): string[] {
  return supplements
    .filter(s => s.intakeHistory.length > 0)
    .sort((a, b) => b.intakeHistory.length - a.intakeHistory.length)
    .slice(0, 3)
    .map(s => s.name);
}
