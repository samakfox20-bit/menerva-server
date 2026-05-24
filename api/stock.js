export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?serietype=line&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(502).json({ error: `FMP fetch failed: ${response.status}` });
    }
    
    const json = await response.json();
    
    if (!json.historical || !Array.isArray(json.historical)) {
      return res.status(404).json({ error: 'no data for ticker' });
    }
    
    const data = json.historical
      .map(d => ({ date: d.date, price: d.close }))
      .reverse()
      .slice(-750);
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'parse failed' });
    }
    
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ ticker, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
