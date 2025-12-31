// In-memory storage for demo
const userProfiles = {};

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

export default function handler(req, res) {
  console.log('Home Location API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User ID is required',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Handle GET request
    if (req.method === 'GET') {
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