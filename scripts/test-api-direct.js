#!/usr/bin/env node

/**
 * Direct test without URLSearchParams
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Read API key
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let API_KEY = '';
lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key === 'TOURAPI_KEY') {
      API_KEY = valueParts.join('=');
    }
  }
});

// Manually encode only the API key (without double encoding)
const encodedKey = encodeURIComponent(API_KEY);

// Build URL manually
const url = `http://apis.data.go.kr/B551011/KorService1/searchKeyword1?serviceKey=${encodedKey}&MobileOS=ETC&MobileApp=TourismExplorer&_type=json&listYN=Y&arrange=A&numOfRows=10&pageNo=1&keyword=${encodeURIComponent('서울')}`;

console.log('🔍 Testing with manually encoded URL\n');
console.log('Original API Key:', API_KEY.substring(0, 20) + '...');
console.log('Encoded API Key:', encodedKey.substring(0, 20) + '...');
console.log('\nFull URL:');
console.log(url.replace(encodedKey, encodedKey.substring(0, 20) + '...'));
console.log('\n' + '='.repeat(60) + '\n');

http.get(url, (res) => {
  let data = '';

  console.log('📊 Response Status:', res.statusCode, res.statusMessage);
  console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));
  console.log('\n');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('📦 Response Body:');
      console.log(JSON.stringify(json, null, 2));

      if (json.response?.header?.resultCode === '00') {
        console.log('\n✅ SUCCESS!');
      } else {
        console.log('\n⚠️  Error Code:', json.response?.header?.resultCode);
        console.log('Error Message:', json.response?.header?.resultMsg);
      }
    } catch (e) {
      console.log('📦 Response Body (raw):');
      console.log(data);
      console.log('\n❌ Not JSON response');
    }
  });
}).on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});
