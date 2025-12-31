import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fallback API handler - routes should now use dedicated serverless functions
export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Fallback API handler called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const method = req.method;
  const url = req.url || '';
  
  // Provide helpful error messages for common routes
  if (url.includes('/location/')) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Location API endpoint not found. Available endpoints: /api/location/validate, /api/location/parse, /api/location/home, /api/location/home/[userId]',
        code: 'LOCATION_ENDPOINT_NOT_FOUND',
        details: { 
          method, 
          url,
          availableEndpoints: [
            'POST /api/location/validate',
            'POST /api/location/parse', 
            'POST /api/location/home',
            'GET /api/location/home/[userId]'
          ]
        }
      }
    });
  }

  // Default 404 for other routes
  return res.status(404).json({
    success: false,
    error: {
      message: 'API endpoint not found. This is a fallback handler - specific routes should use dedicated serverless functions.',
      code: 'ENDPOINT_NOT_FOUND',
      details: { 
        method, 
        url,
        note: 'If you are seeing this, the route may need to be implemented as a serverless function in the /api directory.'
      }
    }
  });
}