module.exports = function handler(req, res) {
  console.log('Index API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({ 
    status: "working", 
    message: "API is functioning with CommonJS",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "/api/validate",
      "/api/parse", 
      "/api/home",
      "/api/health",
      "/api/test-health"
    ]
  });
}