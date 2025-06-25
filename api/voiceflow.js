// api/voiceflow.js
export default async function handler(req, res) {
  // Allow requests from your website
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const { action, userId } = req.body;
    
    // Make sure we have a userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Clean the userId to prevent any malicious input
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Make the request to Voiceflow
    const response = await fetch(`https://general-runtime.voiceflow.com/state/user/${cleanUserId}/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.VOICEFLOW_API_KEY
      },
      body: JSON.stringify({
        action: action,
        config: {
          tts: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Voiceflow API returned error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
