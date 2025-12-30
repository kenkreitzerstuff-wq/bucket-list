import type { VercelRequest, VercelResponse } from '@vercel/node';

// Main API handler with proper ES module syntax
export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const method = req.method;
    const url = req.url || '';
    
    // Health check
    if (url.includes('/health')) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          method,
          url
        }
      });
    }

    // Location validation
    if (url.includes('/location/validate') && method === 'POST') {
      const { location } = req.body || {};
      
      if (!location) {
        return res.status(400).json({
          success: false,
          error: { message: 'Location required', code: 'INVALID_INPUT' }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          validation: { isValid: true, errors: [], warnings: [] },
          normalized: location.trim()
        }
      });
    }

    // Location parsing
    if (url.includes('/location/parse') && method === 'POST') {
      const { location } = req.body || {};
      
      if (!location) {
        return res.status(400).json({
          success: false,
          error: { message: 'Location required', code: 'INVALID_INPUT' }
        });
      }

      const parts = location.split(',').map((p: string) => p.trim());
      return res.status(200).json({
        success: true,
        data: {
          locationData: {
            city: parts[0] || 'Unknown City',
            country: parts[1] || 'Unknown Country',
            coordinates: { lat: 0, lng: 0 },
            airportCode: null
          },
          validation: { isValid: true, errors: [] }
        }
      });
    }

    // Get home location
    if (url.includes('/location/home') && method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          homeLocation: {
            city: 'San Francisco',
            country: 'United States',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            airportCode: 'SFO'
          }
        }
      });
    }

    // Set home location
    if (url.includes('/location/home') && method === 'POST') {
      const { userId, location } = req.body || {};
      
      if (!userId || !location) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID and location required', code: 'INVALID_INPUT' }
        });
      }

      const parts = location.split(',').map((p: string) => p.trim());
      return res.status(200).json({
        success: true,
        data: {
          homeLocation: {
            city: parts[0] || 'Unknown City',
            country: parts[1] || 'Unknown Country',
            coordinates: { lat: 0, lng: 0 },
            airportCode: null
          },
          message: 'Home location saved successfully'
        }
      });
    }

    // Default 404
    return res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
        details: { method, url }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}