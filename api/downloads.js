export default async function handler(req, res) {
  // Enable CORS just in case, but same-origin requests won't need it
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { increment } = req.query;
  const url = increment === 'true'
    ? 'https://api.counterapi.dev/v1/typebot-extension/downloads/up'
    : 'https://api.counterapi.dev/v1/typebot-extension/downloads';

  try {
    const apiRes = await fetch(url);
    if (!apiRes.ok) {
      // If it fails or key doesn't exist, return a default fallback
      res.status(200).json({ count: 1250 });
      return;
    }
    const data = await apiRes.json();
    res.status(200).json({ count: data.count || 1250 });
  } catch (err) {
    res.status(200).json({ count: 1250 });
  }
}
