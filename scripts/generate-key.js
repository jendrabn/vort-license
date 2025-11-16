#!/usr/bin/env node

const crypto = require('crypto');

function generateKey(size = 48) {
  return crypto.randomBytes(size).toString('base64');
}

const sizeArg = process.argv[2];
const size = sizeArg ? parseInt(sizeArg, 10) : 48;

if (Number.isNaN(size) || size <= 0) {
  console.error('Size must be a positive integer.');
  process.exit(1);
}

const key = generateKey(size);
console.log('Generated Key (Base64):');
console.log(key);
