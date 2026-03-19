import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const dataDir = path.resolve(currentDir, '../data');
const travellersFile = path.join(dataDir, 'travellers.json');
const reviewsFile = path.join(dataDir, 'reviews.json');

function ensureFile(filePath) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

function readCollection(filePath) {
  ensureFile(filePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeCollection(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function saveTravellerSnapshot(snapshot) {
  const travellers = readCollection(travellersFile);
  travellers.push(snapshot);
  writeCollection(travellersFile, travellers);
  return snapshot;
}

export function saveReview(review) {
  const reviews = readCollection(reviewsFile);
  reviews.push(review);
  writeCollection(reviewsFile, reviews);
  return review;
}
