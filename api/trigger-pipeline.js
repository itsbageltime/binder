// Called by Vercel Cron at 11:30 UTC (7:30am EDT) daily.
// Triggers the Binder Pipeline workflow_dispatch via GitHub API.
module.exports = async function handler(req, res) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> on every invocation.
  // Reject anything that doesn't match so the endpoint can't be abused.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    console.error('GITHUB_PAT is not set');
    return res.status(500).json({ error: 'GITHUB_PAT not configured' });
  }

  try {
    const response = await fetch(
      'https://api.github.com/repos/itsbageltime/binder/actions/workflows/pipeline.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error('GitHub dispatch failed:', response.status, body);
      return res.status(502).json({ error: 'GitHub dispatch failed', status: response.status });
    }

    const ts = new Date().toISOString();
    console.log('Binder pipeline dispatched at', ts);
    return res.status(200).json({ ok: true, dispatched: ts });
  } catch (e) {
    console.error('Dispatch error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
