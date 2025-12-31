class LocationService {
  static AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;

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
    
    if (this.AIRPORT_CODE_REGEX.test(trimmed.toUpperCase())) {
      const code = trimmed.toUpperCase();
      const mockAirportData = {
        'LAX': {
          city: 'Los Angeles',
          country: 'United States',
          coordinates: { lat: 33.9425, lng: -118.4081 },
          airportCode: 'LAX'
        },
        'JFK': {
          city: 'New York',
          country: 'United States',
          coordinates: { lat: 40.6413, lng: -73.7781 },
          airportCode: 'JFK'
        },
        'LHR': {
          city: 'London',
          country: 'United Kingdom',
          coordinates: { lat: 51.4700, lng: -0.4543 },
          airportCode: 'LHR'
        }
      };

      if (mockAirportData[code]) {
        return mockAirportData[code];
      }

      return {
        city: 'Unknown City',
        country: 'Unknown Country',
        coordinates: { lat: 0, lng: 0 },
        airportCode: code
      };
    }

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

module.exports = async (req, res) => {
  console.log('Parse API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }
    });
  }

  try {
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
    
    res.json({
      success: true,
      data: {
        locationData,
        validation
      }
    });

  } catch (error) {
    console.error('Location parsing error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during location parsing',
        code: 'PARSING_ERROR'
      }
    });
  }
}