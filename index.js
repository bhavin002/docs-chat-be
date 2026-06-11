// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRoutes = require('./routes/api');
const { connection } = require('./connection/connection');
const client = require('./util/posthogClient'); // Import PostHog client

connection();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', apiRoutes);

// Test route to capture an event
app.get('/test-event', async (req, res) => {
  try {
    await client.capture({
      distinctId: 'test_user',
      event: 'test_event',
      properties: {
        key: 'value'
      }
    });
    res.send('Event captured');
  } catch (error) {
    console.error('Failed to send event to PostHog:', error);
    res.status(500).send('Failed to capture event');
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

process.on('SIGINT', async () => {
  await client.shutdown();
  console.log('PostHog client shutdown completed');
  process.exit(0);
});
