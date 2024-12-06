import { ApiSupplementResponse, NutritionalInfo } from '../types';

const OPENFOODFACTS_API = 'https://world.openfoodfacts.org/api/v0/product/';

export async function fetchSupplementInfo(barcode: string): Promise<NutritionalInfo & { product_name?: string } | null> {
  try {
    const response = await fetch(`${OPENFOODFACTS_API}${barcode}.json`);
    const data: ApiSupplementResponse = await response.json();

    if (!data.product) {
      throw new Error('Product not found');
    }

    return {
      product_name: data.product.product_name,
      servingSize: data.product.serving_size || 'Not specified',
      ingredients: data.product.ingredients_text ? 
        data.product.ingredients_text.split(',').map(i => i.trim()) : 
        [],
      allergens: data.product.allergens ? 
        data.product.allergens.split(',').map(a => a.trim()) : 
        [],
      warnings: data.product.warnings || [],
      nutritionalValues: processNutriments(data.product.nutriments)
    };
  } catch (error) {
    console.error('Error fetching supplement info:', error);
    return null;
  }
}

function processNutriments(nutriments?: Record<string, number>) {
  if (!nutriments) return {};
  
  const processed: Record<string, { amount: number; unit: string }> = {};
  
  Object.entries(nutriments).forEach(([key, value]) => {
    if (typeof value === 'number') {
      processed[key] = {
        amount: value,
        unit: determineUnit(key),
      };
    }
  });
  
  return processed;
}

function determineUnit(nutrientKey: string): string {
  if (nutrientKey.includes('_100g')) return 'g/100g';
  if (nutrientKey.includes('_serving')) return 'per serving';
  return 'g';
}

export async function contributeSupplementInfo(supplementData: Partial<NutritionalInfo>) {
  // In a real implementation, this would send data to your backend
  console.log('Contributing supplement info:', supplementData);
  return true;
}
