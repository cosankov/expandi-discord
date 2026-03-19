const { buildDiscordPayload } = require('../../lib/format');

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Decode the Discord webhook URL from the path
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Missing webhook slug.' });
  }

  let discordUrl;
  try {
    discordUrl = Buffer.from(slug, 'base64url').toString('utf-8');
  } catch {
    return res.status(400).json({ error: 'Invalid webhook slug.' });
  }

  // Validate it's a Discord webhook URL
  if (!discordUrl.startsWith('https://discord.com/api/webhooks/') && !discordUrl.startsWith('https://discordapp.com/api/webhooks/')) {
    return res.status(400).json({ error: 'Invalid Discord webhook URL.' });
  }

  // GET = health check (Expandi test may send GET)
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, status: 'ready' });
  }

  // Parse the Expandi payload
  const payload = req.body;
  if (!payload || !payload.hook) {
    return res.status(200).json({ ok: true, status: 'received', note: 'No hook object — test ping acknowledged.' });
  }

  // Format the Discord message
  const discordPayload = buildDiscordPayload(payload);

  // POST to Discord
  try {
    const response = await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Discord API error:', response.status, body);
      return res.status(502).json({
        error: 'Discord rejected the message.',
        status: response.status,
        detail: body,
      });
    }

    return res.status(200).json({
      ok: true,
      event: payload.hook.event,
      contact: [payload.contact?.first_name, payload.contact?.last_name].filter(Boolean).join(' ') || null,
    });
  } catch (err) {
    console.error('Failed to POST to Discord:', err.message);
    return res.status(502).json({ error: 'Failed to reach Discord.', detail: err.message });
  }
};
