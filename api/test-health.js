module.exports = (req, res) => {
  console.log('Test health endpoint called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({ 
    status: "ok", 
    message: "API folder is working",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}