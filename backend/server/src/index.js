import express from 'express';
import { store } from './store.js';
import { validateReport } from './validate.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Bike units POST here. Body is either a single report object, or an array
// of reports (a device buffers points while offline and uploads the batch
// once it regains Wi-Fi/cellular, so the server must accept out-of-order
// backlogs, not just the latest point).
app.post('/api/reports', async (req, res) => {
  const reports = Array.isArray(req.body) ? req.body : [req.body];
  if (reports.length === 0) {
    return res.status(400).json({ error: 'no reports in request body' });
  }

  const errors = [];
  const valid = [];
  reports.forEach((report, index) => {
    const error = validateReport(report);
    if (error) {
      errors.push({ index, error });
    } else {
      valid.push(report);
    }
  });

  for (const report of valid) {
    await store.appendReport(report);
  }

  const status = errors.length > 0 ? 207 : 201;
  res.status(status).json({ accepted: valid.length, rejected: errors });
});

app.get('/api/devices', (req, res) => {
  res.json(store.listLatest());
});

app.get('/api/devices/:deviceId', (req, res) => {
  const latest = store.getLatest(req.params.deviceId);
  if (!latest) {
    return res.status(404).json({ error: 'unknown deviceId' });
  }
  res.json(latest);
});

async function main() {
  await store.loadExisting();
  app.listen(PORT, () => {
    console.log(`alpinetracker server listening on :${PORT}`);
  });
}

main();
