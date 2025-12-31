// In-memory storage for demo
const travelInputs = {};

module.exports = (req, res) => {
  console.log('Travel Input API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle POST /api/travel-input (store travel input)
    if (req.method === 'POST') {
      const { userId, travelInput } = req.body || {};

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required and must be a string',
            code: 'INVALID_USER_ID'
          }
        });
      }

      if (!travelInput || typeof travelInput !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Travel input is required and must be an object',
            code: 'INVALID_INPUT'
          }
        });
      }

      // Store the travel input
      travelInputs[userId] = {
        ...travelInput,
        timestamp: new Date().toISOString(),
        userId
      };
      
      return res.json({
        success: true,
        data: {
          message: 'Travel input stored successfully',
          storedInput: travelInputs[userId]
        }
      });
    }

    // Handle GET /api/travel-input/{userId} (retrieve travel input)
    if (req.method === 'GET') {
      const { url } = req;
      const userId = url?.split('/').pop();

      if (!userId || userId === 'travel-input') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required in URL path',
            code: 'INVALID_USER_ID'
          }
        });
      }

      const storedInput = travelInputs[userId];
      
      if (!storedInput) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'No travel input found for this user',
            code: 'NOT_FOUND'
          }
        });
      }

      return res.json({
        success: true,
        data: { travelInput: storedInput }
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
    console.error('Travel input API error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
}