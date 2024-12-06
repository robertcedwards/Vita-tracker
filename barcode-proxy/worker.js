export default {
	cache: new Map(),
	lastRequestTime: 0,

	async fetch(request, env) {
		// Ignore favicon requests
		if (request.url.includes('favicon.ico')) {
			return new Response(null, { status: 404 });
		}
  
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400'
				}
			});
		}
  
		try {
			if (request.method !== 'POST') {
				return new Response(JSON.stringify({
					error: 'Method not allowed',
					allowedMethods: ['POST']
				}), {
					status: 405,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
  
			const body = await request.json();
			if (!body.barcode) {
				throw new Error('Barcode is required');
			}
  
			// Check cache first
			const cachedData = this.cache.get(body.barcode);
			if (cachedData) {
				console.log('Returning cached data for:', body.barcode);
				return new Response(JSON.stringify(cachedData), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
  
			// Rate limiting
			const now = Date.now();
			const timeSinceLastRequest = now - this.lastRequestTime;
			if (timeSinceLastRequest < 1000) {
				await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
			}
			this.lastRequestTime = Date.now();
  
			let primaryError = null;
			// Try primary API first
			try {
				const primaryResponse = await fetch(
					`https://api.barcodelookup.com/v3/products?barcode=${body.barcode}&formatted=y&key=${env.BARCODE_API_KEY}`,
					{
						method: 'GET',
						headers: {
							'Accept': 'application/json'
						}
					}
				);
  
				if (primaryResponse.ok) {
					const data = await primaryResponse.json();
					return new Response(JSON.stringify(data), {
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*'
						}
					});
				}
				const errorText = await primaryResponse.text();
				primaryError = `Status: ${primaryResponse.status}, ${errorText}`;
			} catch (error) {
				primaryError = error.message;
				console.error('Primary API error:', error);
			}
  
			// Fallback to RapidAPI
			console.log('Primary API failed, trying RapidAPI...');
			const rapidApiResponse = await fetch(
				`https://product-lookup-by-upc-or-ean.p.rapidapi.com/code/${body.barcode}`,
				{
					method: 'GET',
					headers: {
						'x-rapidapi-key': env.RAPIDAPI_KEY,
						'x-rapidapi-host': 'product-lookup-by-upc-or-ean.p.rapidapi.com'
					}
				}
			);
  
			if (!rapidApiResponse.ok) {
				const errorText = await rapidApiResponse.text();
				const rapidApiData = JSON.parse(errorText);
				
				// If RapidAPI returns a valid response with no product, return empty product
				if (rapidApiData.code && !rapidApiData.product) {
					const emptyProduct = {
						products: [{
							title: 'Unknown Product',
							brand: '',
							description: '',
							category: '',
							nutrition: {
								serving_size: 'Not specified',
							},
							ingredients: '',
							allergens: '',
							warnings: []
						}]
					};
					
					return new Response(JSON.stringify(emptyProduct), {
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*'
						}
					});
				}
				
				throw new Error(`Both APIs failed. Primary: ${primaryError}, RapidAPI: ${rapidApiResponse.status} - ${errorText}`);
			}
  
			const rapidApiData = await rapidApiResponse.json();
			console.log('RapidAPI Response:', rapidApiData);
  
			const transformedData = {
				products: [{
					title: rapidApiData.product?.name || 'Unknown Product',
					brand: rapidApiData.product?.brand || '',
					description: rapidApiData.product?.description || '',
					category: rapidApiData.product?.category || '',
					image: rapidApiData.product?.image || '',
					nutrition: {
						serving_size: rapidApiData.product?.description?.match(/Serving Size[:\s]+([^.]+)/i)?.[1] || 'See product description',
					},
					ingredients: rapidApiData.product?.description || '',
					allergens: '',
					warnings: []
				}]
			};
  
			// Cache the response
			this.cache.set(body.barcode, transformedData);
  
			return new Response(JSON.stringify(transformedData), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
  
		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({
				error: error.message,
				stack: error.stack,
				type: error.constructor.name
			}), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}
	}
};