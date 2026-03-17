import express from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
import { saveReview, saveTravellerSnapshot } from './storage.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

const port = process.env.PORT || 4000;

async function fetchTravellerFromSource(pnr) {
  const baseUrl = process.env.IRCTC_API_BASE_URL;
  const apiKey = process.env.IRCTC_API_KEY;

  if (!baseUrl || !apiKey) {
    return {
      pnr,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      boardingStation: 'NDLS',
      destinationStation: 'BCT',
      travellers: [
        { name: 'A. Kumar', age: 34, gender: 'M', coach: 'A1', berth: '21' },
        { name: 'R. Kumar', age: 31, gender: 'F', coach: 'A1', berth: '22' }
      ],
      source: 'mock'
    };
  }

  const response = await fetch(`${baseUrl}/pnr/${pnr}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`IRCTC provider error: ${response.status}`);
  }

  const payload = await response.json();
  return {
    pnr,
    trainNumber: payload.trainNumber,
    trainName: payload.trainName,
    boardingStation: payload.boardingStation,
    destinationStation: payload.destinationStation,
    travellers: payload.passengers,
    source: 'provider'
  };
}

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/trips/fetch-by-pnr', async (req, res) => {
  const { pnr, requestedBy } = req.body;

  if (!pnr || String(pnr).length !== 10) {
    return res.status(400).json({ error: 'PNR must be exactly 10 digits.' });
  }

  try {
    const data = await fetchTravellerFromSource(String(pnr));
    const snapshot = {
      ...data,
      requestedBy: requestedBy || 'unknown',
      fetchedAt: new Date().toISOString()
    };

    saveTravellerSnapshot(snapshot);
    return res.json(snapshot);
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.post('/api/reviews', (req, res) => {
  const { pnr, staffId, cleanlinessRating, comments, signaturePayload } = req.body;

  if (!pnr || !staffId || !cleanlinessRating || !signaturePayload) {
    return res.status(400).json({
      error: 'pnr, staffId, cleanlinessRating, and signaturePayload are required.'
    });
  }

  const review = {
    id: crypto.randomUUID(),
    pnr,
    staffId,
    cleanlinessRating,
    comments: comments || '',
    signaturePayload,
    createdAt: new Date().toISOString()
  };

  saveReview(review);
  return res.status(201).json(review);
});

app.listen(port, () => {
  console.log(`RailOps backend listening on port ${port}`);
});
