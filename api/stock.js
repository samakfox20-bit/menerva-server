export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (3 * 365 * 24 * 60 * 60);
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${start}&period2=${end}&interval=1d&events=history`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return res.status(502).json({ error: `Yahoo fetch failed: ${response.status}` });
    }
    
    const text = await response.text();
    if (!text || !text.includes(',')) {
      return res.status(404).json({ error: 'no data' });
    }
    
    const lines = text.trim().split('\n');
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 5) continue;
      const close = parseFloat(parts[4]);
      if (isNaN(close)) continue;
      data.push({ date: parts[0], price: close });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'parse failed' });
    }
    
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ ticker, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
