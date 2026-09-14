import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(DATA_DIR, 'reports.jsonl');

// Latest report per device, kept in memory and rebuilt from the append-only
// log on startup. The log itself is the durable record — this is a cache.
const latestByDevice = new Map();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadExisting() {
  await ensureDataDir();
  let contents;
  try {
    contents = await fs.readFile(LOG_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const line of contents.split('\n')) {
    if (!line.trim()) continue;
    const report = JSON.parse(line);
    latestByDevice.set(report.deviceId, report);
  }
}

async function appendReport(report) {
  await ensureDataDir();
  await fs.appendFile(LOG_FILE, JSON.stringify(report) + '\n', 'utf8');
  latestByDevice.set(report.deviceId, report);
}

function getLatest(deviceId) {
  return latestByDevice.get(deviceId) ?? null;
}

function listLatest() {
  return Array.from(latestByDevice.values());
}

export const store = { loadExisting, appendReport, getLatest, listLatest };
