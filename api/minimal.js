// Minimal JavaScript API function to test if the issue is with TypeScript
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Minimal API called:', req.method, req.url);
    
    res.status(200).json({
      success: true,
      message: 'Minimal API working',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Minimal API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};