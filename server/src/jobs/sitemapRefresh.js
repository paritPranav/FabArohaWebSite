// server/src/jobs/sitemapRefresh.js
// Triggers on-demand ISR revalidation in the Next.js client every day at 00:05 UTC
const cron = require('node-cron');
const https = require('https');
const http  = require('http');

function startSitemapRefreshJob() {
  // ┌─ min  ┬─ hour ┬─ day  ┬─ month ┬─ weekday
  // 5       0       *        *         *         → 00:05 every day UTC
  cron.schedule('5 0 * * *', () => {
    console.log('[cron] sitemapRefresh — triggering daily revalidation');

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const secret    = process.env.REVALIDATE_SECRET;

    if (!secret) {
      console.warn('[cron] REVALIDATE_SECRET not set — skipping revalidation ping');
      return;
    }

    const url = `${clientUrl}/api/revalidate-sitemap?secret=${encodeURIComponent(secret)}`;
    const lib = url.startsWith('https') ? https : http;

    lib.get(url, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () =>
        console.log(`[cron] sitemapRefresh — status ${res.statusCode}: ${body.trim()}`)
      );
    }).on('error', (err) => {
      console.error('[cron] sitemapRefresh — request failed:', err.message);
    });
  }, { timezone: 'UTC' });

  console.log('[cron] Sitemap refresh job scheduled (daily 00:05 UTC)');
}

module.exports = { startSitemapRefreshJob };
