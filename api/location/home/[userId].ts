import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LocationData, ApiResponse } from '../types';

// In-memory storage for demo (in production, use a database)
const userProfiles: { [userId: string]: any } = {};

// UserProfileStorage for serverless function
class UserProfileStorage {
  public static getHomeLocation(userId: string): LocationData | null {
    const profile = userProfiles[userId];
    return profile?.homeLocation || null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
        message: 'Method not allowed',
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

    res.json({
      success: true,
      data: { homeLocation }
    } as ApiResponse<{ homeLocation: LocationData }>);

  } catch (error) {
    console.error('Home location retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during home location retrieval',
        code: 'RETRIEVAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    } as ApiResponse<never>);
  }
}