import { ApiSupplementResponse, NutritionalInfo } from '../types';

// Use local development URL when in development mode
const WORKER_URL = 'https://barcode-proxy.robert-pastorella.workers.dev';


export async function fetchSupplementInfo(barcode: string): Promise<NutritionalInfo & { product_name?: string } | null> {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ barcode })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.products?.[0]) {
      throw new Error('Product not found');
    }

    const product = data.products[0];
    
    return {
      product_name: product.title || product.brand,
      servingSize: product.nutrition?.serving_size || 'Not specified',
      ingredients: product.ingredients ? 
        product.ingredients.split(',').map((i: string) => i.trim()) : 
        [],
      allergens: product.allergens ? 
        product.allergens.split(',').map((a: string) => a.trim()) : 
        [],
      warnings: product.warnings || [],
      nutritionalValues: processNutriments(product.nutrition)
    };
  } catch (error) {
    console.error('Error fetching supplement info:', error);
    return null;
  }
}

function processNutriments(nutrition?: any): Record<string, { amount: number; unit: string }> {
  if (!nutrition) return {};
  
  const processed: Record<string, { amount: number; unit: string }> = {};
  
  // Map nutrition facts from the API response
  Object.entries(nutrition).forEach(([key, value]) => {
    if (typeof value === 'string' && !['serving_size', 'ingredients'].includes(key)) {
      const match = value.match(/^([\d.]+)\s*(\w+)$/);
      if (match) {
        processed[key] = {
          amount: parseFloat(match[1]),
          unit: match[2]
        };
      }
    }
  });
  
  return processed;
}

export async function contributeSupplementInfo(supplementData: Partial<NutritionalInfo>) {
  // In a real implementation, this would send data to your backend
  console.log('Contributing supplement info:', supplementData);
  return true;
}
