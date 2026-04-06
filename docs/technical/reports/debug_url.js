const { pathToFileURL } = require('url');
const path = require('path');

const testPath = "J:/PODCAST/Programmi/DISORDINATINFORMATI/ASSETS/AUDIO/2025/00 DISORDINATINFORMATI SIGLA 2026.wav";
const encodedUrl = "media://J:/PODCAST/Programmi/DISORDINATINFORMATI/ASSETS/AUDIO/2025/00%20DISORDINATINFORMATI%20SIGLA%202026.wav";

console.log("Original Path:", testPath);

// Simulating protocol handler logic
const urlStr = encodedUrl.replace('media://', '');
console.log("Stripped:", urlStr);

const decoded = decodeURIComponent(urlStr);
console.log("Decoded:", decoded);

const textUrl = pathToFileURL(decoded).toString();
console.log("File URL:", textUrl);

// Test with normalized path
const normalized = path.normalize(decoded);
console.log("Normalized:", normalized);
const normUrl = pathToFileURL(normalized).toString();
console.log("Normalized File URL:", normUrl);
