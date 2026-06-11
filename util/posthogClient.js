const { PostHog } = require('posthog-node');

const client = new PostHog(
  process.env.POSTHOG_API_KEY,
  { host: 'https://us.i.posthog.com' }
);

module.exports = client;
