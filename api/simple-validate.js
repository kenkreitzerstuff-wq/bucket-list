module.exports = function handler(req, res) {
  console.log('Simple validate API called:', req.method, req.url);
  
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

    // Simple validation
    const validation = {
      isValid: location.trim().length > 0,
      errors: location.trim().length === 0 ? ['Location cannot be empty'] : [],
      warnings: []
    };
    
    res.json({
      success: true,
      data: {
        validation,
        normalized: validation.isValid ? location.trim() : null
      }
    });

  } catch (error) {
    console.error('Location validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during location validation',
        code: 'VALIDATION_ERROR'
      }
    });
  }
}