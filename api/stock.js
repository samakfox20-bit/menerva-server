export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  try {
    const url = `https://stooq.com/q/d/l/?s=${ticker}&i=d`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Stooq fetch failed' });
    }
    const text = await response.text();
    
    if (text.startsWith('No data') || !text.includes(',')) {
      return res.status(404).json({ error: 'no data for ticker' });
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
    return res.status(200).json({ ticker, data: data.slice(-750) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
