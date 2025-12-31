module.exports = (req, res) => {
  console.log('Follow-up Questions API called:', req.method, req.url);
  
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

    // Generate mock follow-up questions
    const followUpQuestions = [
      {
        id: 'budget_preference',
        question: 'What is your preferred budget range for this trip?',
        type: 'multiple_choice',
        options: ['Budget ($)', 'Mid-range ($$)', 'Luxury ($$$)', 'No preference']
      },
      {
        id: 'travel_style',
        question: 'What type of travel experience are you looking for?',
        type: 'multiple_choice',
        options: ['Adventure', 'Relaxation', 'Cultural', 'Food & Drink', 'Mixed']
      },
      {
        id: 'accommodation',
        question: 'What type of accommodation do you prefer?',
        type: 'multiple_choice',
        options: ['Hotel', 'Airbnb', 'Hostel', 'Resort', 'No preference']
      }
    ];
    
    res.json({
      success: true,
      data: {
        questions: followUpQuestions,
        totalQuestions: followUpQuestions.length
      }
    });

  } catch (error) {
    console.error('Follow-up questions generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during follow-up questions generation',
        code: 'GENERATION_ERROR'
      }
    });
  }
}