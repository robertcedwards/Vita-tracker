import { ApiSupplementResponse, NutritionalInfo } from '../types';

const OPENFOODFACTS_API = 'https://world.openfoodfacts.org/api/v0/product/';

export async function fetchSupplementInfo(barcode: string): Promise<NutritionalInfo | null> {
  try {
    const response = await fetch(`${OPENFOODFACTS_API}${barcode}.json`);
    const data: ApiSupplementResponse = await response.json();

    if (!data.product) {
      throw new Error('Product not found');
    }

    const nutritionalInfo: NutritionalInfo = {
      servingSize: data.product.serving_size || 'Not specified',
      ingredients: data.product.ingredients_text ? 
        data.product.ingredients_text.split(',').map(i => i.trim()) : 
        [],
      allergens: data.product.allergens ? 
        data.product.allergens.split(',').map(a => a.trim()) : 
        [],
      warnings: data.product.warnings || [],
      nutritionalValues: {}
    };

    if (data.product.nutriments) {
      Object.entries(data.product.nutriments).forEach(([key, value]) => {
        if (typeof value === 'number') {
          nutritionalInfo.nutritionalValues![key] = {
            amount: value,
            unit: determineUnit(key),
          };
        }
      });
    }

    return nutritionalInfo;
  } catch (error) {
    console.error('Error fetching supplement info:', error);
    return null;
  }
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
