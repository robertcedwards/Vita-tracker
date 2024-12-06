// Add or update these interfaces
interface BarcodeApiResponse {
  products: Array<{
    title: string;
    brand: string;
    nutrition?: {
      serving_size?: string;
      [key: string]: any;
    };
    ingredients?: string;
    allergens?: string;
    warnings?: string[];
  }>;
}

// Update the existing NutritionalInfo interface if needed
interface NutritionalInfo {
  product_name?: string;
  servingSize: string;
  ingredients: string[];
  allergens: string[];
  warnings: string[];
  nutritionalValues: Record<string, { amount: number; unit: string }>;
} 