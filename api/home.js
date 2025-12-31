// In-memory storage for demo
const userProfiles = {};

class LocationService {
  static validateLocation(input) {
    const errors = [];
    const warnings = [];

    if (!input || input.trim().length === 0) {
      errors.push('Location input cannot be empty');
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }

  static async parseLocationData(input) {
    const trimmed = input.trim();
    
    if (trimmed.includes(',')) {
      const [city, country] = trimmed.split(',').map(s => s.trim());
      return {
        city,
        country,
        coordinates: this.getMockCoordinates(city, country),
        airportCode: undefined
      };
    }

    return {
      city: trimmed,
      country: 'Unknown Country',
      coordinates: this.getMockCoordinates(trimmed, 'Unknown')
    };
  }

  static getMockCoordinates(city, country) {
    const hash = (city + country).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const lat = (hash % 180) - 90;
    const lng = ((hash * 2) % 360) - 180;
    
    return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 };
  }
}

class UserProfileStorage {
  static storeHomeLocation(userId, location) {
    if (!userProfiles[userId]) {
      userProfiles[userId] = {
        id: userId,
        homeLocation: null,
        preferences: {},
        bucketList: []
      };
    }
    userProfiles[userId].homeLocation = location;
  }

  static getHomeLocation(userId) {
    const profile = userProfiles[userId];
    return profile?.homeLocation || null;
  }
}

module.exports = async (req, res) => {
  console.log('Home API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle GET /api/home/{userId} - extract userId from URL
    if (req.method === 'GET') {
      const { url } = req;
      const userId = url?.split('/').pop(); // Get last part of URL

      if (!userId || userId === 'home') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required in URL path',
            code: 'INVALID_USER_ID'
          }
        });
      }

      const homeLocation = UserProfileStorage.getHomeLocation(userId);
      
      if (!homeLocation) {
        // Return a default location for demo purposes
        const defaultLocation = {
          city: 'San Francisco',
          country: 'United States',
          coordinates: { lat: 37.7749, lng: -122.4194 },
          airportCode: 'SFO'
        };

        return res.json({
          success: true,
          data: { homeLocation: defaultLocation }
        });
      }

      return res.json({
        success: true,
        data: { homeLocation }
      });
    }

    // Handle POST /api/home
    if (req.method === 'POST') {
      const { userId, location } = req.body || {};

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required and must be a string',
            code: 'INVALID_USER_ID'
          }
        });
      }

      if (!location || typeof location !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Location input is required and must be a string',
            code: 'INVALID_INPUT'
          }
        });
      }

      const validation = LocationService.validateLocation(location);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid location format',
            code: 'INVALID_LOCATION',
            details: validation.errors
          }
        });
      }

      const locationData = await LocationService.parseLocationData(location);
      UserProfileStorage.storeHomeLocation(userId, locationData);
      
      return res.json({
        success: true,
        data: {
          homeLocation: locationData,
          message: 'Home location updated successfully'
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }
    });

  } catch (error) {
    console.error('Home location API error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
}