import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple health check endpoint for testing
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    
    // Health check endpoint
    if (url === '/api/health' || url?.endsWith('/api/health')) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'travel-bucket-list-backend',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          method,
          url
        }
      });
    }

    // Location endpoints
    if (url?.includes('/api/location/')) {
      if (url.includes('/validate') && method === 'POST') {
        const { location } = req.body || {};
        
        if (!location || typeof location !== 'string') {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Location input is required and must be a string',
              code: 'INVALID_INPUT'
            }
          });
        }

        // Simple validation logic
        const isValid = location.trim().length > 0;
        const errors = isValid ? [] : ['Location cannot be empty'];
        const warnings = location.includes(',') ? [] : ['Consider using "City, Country" format for better accuracy'];

        return res.status(200).json({
          success: true,
          data: {
            validation: {
              isValid,
              errors,
              warnings
            },
            normalized: isValid ? location.trim() : null
          }
        });
      }

      if (url.includes('/parse') && method === 'POST') {
        const { location } = req.body || {};
        
        if (!location || typeof location !== 'string') {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Location input is required',
              code: 'INVALID_INPUT'
            }
          });
        }

        // Simple parsing logic
        const parts = location.split(',').map(p => p.trim());
        const city = parts[0] || 'Unknown City';
        const country = parts[1] || 'Unknown Country';

        return res.status(200).json({
          success: true,
          data: {
            locationData: {
              city,
              country,
              coordinates: { lat: 0, lng: 0 }, // Mock coordinates
              airportCode: null
            },
            validation: {
              isValid: true,
              errors: []
            }
          }
        });
      }

      if (url.includes('/home') && method === 'POST') {
        const { userId, location } = req.body || {};
        
        if (!userId || !location) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'User ID and location are required',
              code: 'INVALID_INPUT'
            }
          });
        }

        // Mock storage - in a real app, this would save to a database
        const parts = location.split(',').map(p => p.trim());
        const city = parts[0] || 'Unknown City';
        const country = parts[1] || 'Unknown Country';

        return res.status(200).json({
          success: true,
          data: {
            homeLocation: {
              city,
              country,
              coordinates: { lat: 0, lng: 0 },
              airportCode: null
            },
            message: 'Home location saved successfully'
          }
        });
      }

      if (url.includes('/home/') && method === 'GET') {
        const userId = url.split('/home/')[1];
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'User ID is required',
              code: 'INVALID_INPUT'
            }
          });
        }

        // Mock retrieval - in a real app, this would load from a database
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
    }

    // Travel input endpoints
    if (url?.includes('/api/travel-input/')) {
      if (url.includes('/validate') && method === 'POST') {
        return res.status(200).json({
          success: true,
          data: {
            validation: { isValid: true, errors: [] },
            completenessScore: 85,
            incompleteAnalysis: {
              needsFollowUp: false,
              incompleteAreas: [],
              suggestions: []
            },
            normalized: req.body?.travelInput || null
          }
        });
      }

      if (url.includes('/follow-up-questions') && method === 'POST') {
        return res.status(200).json({
          success: true,
          data: {
            questions: [],
            incompleteAnalysis: {
              needsFollowUp: false,
              incompleteAreas: [],
              suggestions: []
            },
            hasFollowUp: false
          }
        });
      }

      if (url.includes('/store') && method === 'POST') {
        return res.status(200).json({
          success: true,
          data: {
            message: 'Travel input stored successfully',
            completenessScore: 85,
            storedInput: req.body?.travelInput || {}
          }
        });
      }

      if (method === 'GET' && url.match(/\/api\/travel-input\/[^\/]+$/)) {
        return res.status(200).json({
          success: true,
          data: {
            travelInput: {
              destinations: ['Paris', 'Rome'],
              experiences: ['Museums', 'Food tours'],
              preferences: {
                travelStyle: 'luxury',
                groupSize: 2
              }
            },
            completenessScore: 85,
            incompleteAnalysis: {
              needsFollowUp: false,
              incompleteAreas: [],
              suggestions: []
            }
          }
        });
      }
    }

    // Recommendations endpoints
    if (url?.includes('/api/recommendations/')) {
      if (url.includes('/generate') && method === 'POST') {
        return res.status(200).json({
          success: true,
          data: [
            {
              type: 'destination',
              title: 'Paris, France',
              description: 'The City of Light offers world-class museums, cuisine, and architecture.',
              reasoning: 'Based on your interest in museums and luxury travel.',
              confidence: 0.9,
              relatedTo: ['Museums', 'Cuisine'],
              metadata: {
                season: 'spring',
                duration: 5,
                difficulty: 'easy'
              }
            }
          ]
        });
      }

      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Bucket list endpoints
    if (url?.includes('/api/bucket-list')) {
      if (method === 'GET') {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      if (method === 'POST') {
        return res.status(200).json({
          success: true,
          data: {
            id: `item-${Date.now()}`,
            ...req.body
          }
        });
      }
    }

    // Default 404 response
    return res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
        details: {
          method,
          url,
          availableEndpoints: [
            'GET /api/health',
            'POST /api/location/validate',
            'POST /api/location/parse',
            'POST /api/location/home',
            'GET /api/location/home/:userId',
            'POST /api/travel-input/validate',
            'POST /api/travel-input/follow-up-questions',
            'POST /api/travel-input/store',
            'GET /api/travel-input/:userId',
            'POST /api/recommendations/generate',
            'GET /api/bucket-list',
            'POST /api/bucket-list'
          ]
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    });
  }
}