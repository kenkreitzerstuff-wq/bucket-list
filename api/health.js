module.exports = (req, res) => {
  console.log('Health check endpoint called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({ 
    status: "healthy", 
    message: "Location API is running",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/location/validate",
      "/api/location/parse", 
      "/api/location/home",
      "/api/location/home/{userId}"
    ]
  });
}