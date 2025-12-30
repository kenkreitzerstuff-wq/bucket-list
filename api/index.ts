// Absolute minimal API function
export default function handler(req, res) {
  console.log('API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    message: 'API working',
    method: req.method,
    url: req.url
  });
}