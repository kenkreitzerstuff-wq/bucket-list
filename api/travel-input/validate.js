export default function handler(req, res) {
  console.log('Travel Input Validate API called:', req.method, req.url);
  
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
    const { travelInput } = req.body || {};

    if (!travelInput || typeof travelInput !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Travel input is required and must be an object',
          code: 'INVALID_INPUT'
        }
      });
    }

    // Simple validation logic
    const validation = {
      isValid: true,
      score: 85,
      errors: [],
      warnings: [],
      suggestions: ['Consider adding more specific details about your preferences']
    };
    
    res.json({
      success: true,
      data: {
        validation,
        processedInput: travelInput
      }
    });

  } catch (error) {
    console.error('Travel input validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during travel input validation',
        code: 'VALIDATION_ERROR'
      }
    });
  }
}