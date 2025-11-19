#!/usr/bin/env node

/**
 * Test script for Tour API key
 * This script directly tests the Tour API to see the exact error response
 *
 * Usage: node scripts/test-api-key.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let API_KEY = '';
let BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');

      if (key === 'TOURAPI_KEY') {
        API_KEY = value;
      } else if (key === 'TOURAPI_BASE_URL') {
        BASE_URL = value;
      }
    }
  });
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  process.exit(1);
}

if (!API_KEY) {
  console.error('❌ Error: TOURAPI_KEY not found in .env.local');
  process.exit(1);
}

console.log('🔍 Testing Tour API Configuration\n');
console.log('Base URL:', BASE_URL);
console.log('API Key:', API_KEY.substring(0, 20) + '...' + API_KEY.substring(API_KEY.length - 10));
console.log('API Key Length:', API_KEY.length);
console.log('\n' + '='.repeat(60) + '\n');

// Test 1: Search with keyword
const testSearch = () => {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      arrange: 'A',
      numOfRows: '10',
      pageNo: '1',
      keyword: '서울'
    });

    const url = `${BASE_URL}/searchKeyword2?${params.toString()}`;

    console.log('🔎 Test 1: Searching with keyword "서울"\n');
    console.log('Full URL (truncated key):');
    console.log(url.replace(API_KEY, API_KEY.substring(0, 20) + '...'));
    console.log('\n' + '-'.repeat(60) + '\n');

    const protocol = BASE_URL.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';

      console.log('📊 Response Status:', res.statusCode, res.statusMessage);
      console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));
      console.log('\n' + '-'.repeat(60) + '\n');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('📦 Response Body:');
          console.log(JSON.stringify(json, null, 2));

          if (res.statusCode === 200) {
            if (json.response?.header?.resultCode === '00') {
              console.log('\n✅ SUCCESS: API call successful!');
              console.log('Total items found:', json.response?.body?.totalCount || 0);
            } else {
              console.log('\n⚠️  API returned error code:', json.response?.header?.resultCode);
              console.log('Error message:', json.response?.header?.resultMsg);
            }
          } else {
            console.log('\n❌ FAILED: HTTP status', res.statusCode);
          }

          resolve();
        } catch (e) {
          console.log('📦 Response Body (raw):');
          console.log(data);
          console.log('\n❌ Failed to parse JSON:', e.message);
          resolve();
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      reject(e);
    });

    req.end();
  });
};

// Test 2: Get area codes (simpler endpoint)
const testAreaCodes = () => {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      numOfRows: '5',
      pageNo: '1'
    });

    const url = `${BASE_URL}/areaCode2?${params.toString()}`;

    console.log('\n\n' + '='.repeat(60) + '\n');
    console.log('🔎 Test 2: Getting area codes (simpler endpoint)\n');
    console.log('Full URL (truncated key):');
    console.log(url.replace(API_KEY, API_KEY.substring(0, 20) + '...'));
    console.log('\n' + '-'.repeat(60) + '\n');

    const protocol = BASE_URL.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';

      console.log('📊 Response Status:', res.statusCode, res.statusMessage);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('📦 Response Body:');
          console.log(JSON.stringify(json, null, 2));

          if (res.statusCode === 200) {
            if (json.response?.header?.resultCode === '00') {
              console.log('\n✅ SUCCESS: API call successful!');
            } else {
              console.log('\n⚠️  API returned error code:', json.response?.header?.resultCode);
              console.log('Error message:', json.response?.header?.resultMsg);
            }
          } else {
            console.log('\n❌ FAILED: HTTP status', res.statusCode);
          }

          resolve();
        } catch (e) {
          console.log('📦 Response Body (raw):');
          console.log(data);
          resolve();
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      reject(e);
    });

    req.end();
  });
};

// Run tests
const runTests = async () => {
  try {
    await testSearch();
    await testAreaCodes();

    console.log('\n\n' + '='.repeat(60));
    console.log('\n📋 Common Error Codes:\n');
    console.log('00  = SUCCESS');
    console.log('01  = APPLICATION_ERROR (서비스 내부 오류)');
    console.log('02  = DB_ERROR');
    console.log('03  = NODATA_ERROR (데이터 없음)');
    console.log('04  = HTTP_ERROR');
    console.log('05  = SERVICETIMEOUT_ERROR');
    console.log('10  = INVALID_REQUEST_PARAMETER_ERROR (필수 파라미터 누락)');
    console.log('11  = NO_MANDATORY_REQUEST_PARAMETERS_ERROR');
    console.log('12  = NO_OPENAPI_SERVICE_ERROR');
    console.log('20  = SERVICE_ACCESS_DENIED_ERROR (서비스 접근 거부)');
    console.log('21  = TEMPORARILY_DISABLE_THE_SERVICEKEY_ERROR');
    console.log('22  = LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR');
    console.log('30  = SERVICE_KEY_IS_NOT_REGISTERED_ERROR (등록되지 않은 키)');
    console.log('31  = DEADLINE_HAS_EXPIRED_ERROR (기한 만료)');
    console.log('32  = UNREGISTERED_IP_ERROR');
    console.log('33  = UNSIGNED_CALL_ERROR (서명되지 않은 호출)');
    console.log('99  = UNKNOWN_ERROR');

    console.log('\n\n💡 Troubleshooting:\n');
    console.log('1. If resultCode is 30 or 33: API key not approved yet');
    console.log('   → Check status at https://www.data.go.kr/');
    console.log('   → Go to 마이페이지 > 오픈API > 개발계정');
    console.log('   → Status should be "활용승인" (approved)\n');

    console.log('2. If HTTP 500 error: Server issue');
    console.log('   → Check if API key has special characters');
    console.log('   → Try both Encoding and Decoding keys\n');

    console.log('3. If resultCode is 10: Missing parameters');
    console.log('   → Check all required parameters are sent\n');

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
};

runTests();
