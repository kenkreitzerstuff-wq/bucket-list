import type { VercelRequest, VercelResponse } from '@vercel/node';

interface LocationData {
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  airportCode?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// In-memory storage for demo
const userProfiles: { [userId: string]: any } = {};

class UserProfileStorage {
  public static getHomeLocation(userId: string): LocationData | null {
    const profile = userProfiles[userId];
    return profile?.homeLocation || null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Location home [userId] API called:', req.method, req.url, req.query);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed - use GET',
        code: 'METHOD_NOT_ALLOWED'
      }
    } as ApiResponse<never>);
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
      } as ApiResponse<never>);
    }

    const homeLocation = UserProfileStorage.getHomeLocation(userId);
    
    if (!homeLocation) {
      // Return a default location for demo purposes
      const defaultLocation: LocationData = {
        city: 'San Francisco',
        country: 'United States',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        airportCode: 'SFO'
      };

      return res.json({
        success: true,
        data: { homeLocation: defaultLocation }
      } as ApiResponse<{ homeLocation: LocationData }>);
    }

    return res.json({
      success: true,
      data: { homeLocation }
    } as ApiResponse<{ homeLocation: LocationData }>);

  } catch (error) {
    console.error('Home location retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during home location retrieval',
        code: 'RETRIEVAL_ERROR'
      }
    } as ApiResponse<never>);
  }
}