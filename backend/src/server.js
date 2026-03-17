import crypto from 'node:crypto';
import http from 'node:http';
import { URL } from 'node:url';
import { saveReview, saveTravellerSnapshot } from './storage.js';

const port = Number(process.env.PORT || 4000);

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 4 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

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

function isValidPnr(pnr) {
  return typeof pnr === 'string' && /^\d{10}$/.test(pnr);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && path === '/health') {
    jsonResponse(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && path === '/api/trips/fetch-by-pnr') {
    try {
      const { pnr, requestedBy } = await readJsonBody(req);
      if (!isValidPnr(String(pnr ?? ''))) {
        jsonResponse(res, 400, { error: 'PNR must be exactly 10 digits.' });
        return;
      }

      const data = await fetchTravellerFromSource(String(pnr));
      const snapshot = {
        ...data,
        requestedBy: requestedBy || 'unknown',
        fetchedAt: new Date().toISOString()
      };

      saveTravellerSnapshot(snapshot);
      jsonResponse(res, 200, snapshot);
      return;
    } catch (error) {
      jsonResponse(res, 502, { error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && path === '/api/reviews') {
    try {
      const { pnr, staffId, cleanlinessRating, comments, signaturePayload } = await readJsonBody(req);
      if (!isValidPnr(String(pnr ?? '')) || !staffId || !signaturePayload) {
        jsonResponse(res, 400, {
          error: 'pnr (10 digits), staffId, cleanlinessRating, and signaturePayload are required.'
        });
        return;
      }

      const ratingNumber = Number(cleanlinessRating);
      if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
        jsonResponse(res, 400, { error: 'cleanlinessRating must be an integer between 1 and 5.' });
        return;
      }

      const review = {
        id: crypto.randomUUID(),
        pnr: String(pnr),
        staffId: String(staffId),
        cleanlinessRating: ratingNumber,
        comments: comments ? String(comments) : '',
        signaturePayload: String(signaturePayload),
        createdAt: new Date().toISOString()
      };

      saveReview(review);
      jsonResponse(res, 201, review);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
      return;
    }
  }

  jsonResponse(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`RailOps backend listening on port ${port}`);
});
