/**
 * Automated Test Suite for MongoDB Environment Variable Resolution & Sanitization
 * Tests all requirements from Part 3:
 * 1. Each supported variable individually (MONGODB_URI, MONGODB_URL, MONGO_URL, DATABASE_URL)
 * 2. Priority order when multiple variables are configured
 * 3. Empty or whitespace-only values
 * 4. Invalid higher-priority values (must NOT silently fall back to lower-priority)
 * 5. No configured URI
 * 6. Malformed URIs
 * 7. Sanitized error messages (no credentials leaked)
 * 8. Sanitized URI masking
 */

import {
  SUPPORTED_MONGO_ENV_VARS,
  sanitizeMongoUri,
  resolveMongoUri,
  sanitizeMongoError
} from '../lib/db/mongodb.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failed++;
    console.error(`[FAIL] ${testName}${details ? ` (${details})` : ''}`);
  }
}

// Backup current environment
const originalEnv = { ...process.env };

function clearMongoEnv() {
  for (const key of SUPPORTED_MONGO_ENV_VARS) {
    delete process.env[key];
  }
}

console.log('=== TEST SUITE: MONGODB ENVIRONMENT RESOLUTION & SANITIZATION ===\n');

try {
  // Test 1: No configured URI
  clearMongoEnv();
  const noUriRes = resolveMongoUri();
  assert(noUriRes.isConfigured === false && noUriRes.isValid === false, '1. No Configured URI', noUriRes.error);

  // Test 2: Each supported variable individually
  for (const envKey of SUPPORTED_MONGO_ENV_VARS) {
    clearMongoEnv();
    process.env[envKey] = 'mongodb+srv://admin_user:SuperSecret123@cluster0.abc.mongodb.net/burhanstore';
    const res = resolveMongoUri();
    assert(
      res.isConfigured === true && res.isValid === true && res.envKeyUsed === envKey,
      `2. Individual Variable: ${envKey}`,
      `Resolved key: ${res.envKeyUsed}`
    );
  }

  // Test 3: Priority order when multiple variables are configured
  // Priority: MONGODB_URI > MONGODB_URL > MONGO_URL > DATABASE_URL
  clearMongoEnv();
  process.env.DATABASE_URL = 'mongodb+srv://user:pass@cluster.mongodb.net/db_database_url';
  process.env.MONGO_URL = 'mongodb+srv://user:pass@cluster.mongodb.net/db_mongo_url';
  process.env.MONGODB_URL = 'mongodb+srv://user:pass@cluster.mongodb.net/db_mongodb_url';
  process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/db_mongodb_uri';
  
  let pRes = resolveMongoUri();
  assert(pRes.envKeyUsed === 'MONGODB_URI', '3a. Priority 1: MONGODB_URI over all others', pRes.envKeyUsed);

  delete process.env.MONGODB_URI;
  pRes = resolveMongoUri();
  assert(pRes.envKeyUsed === 'MONGODB_URL', '3b. Priority 2: MONGODB_URL over MONGO_URL and DATABASE_URL', pRes.envKeyUsed);

  delete process.env.MONGODB_URL;
  pRes = resolveMongoUri();
  assert(pRes.envKeyUsed === 'MONGO_URL', '3c. Priority 3: MONGO_URL over DATABASE_URL', pRes.envKeyUsed);

  delete process.env.MONGO_URL;
  pRes = resolveMongoUri();
  assert(pRes.envKeyUsed === 'DATABASE_URL', '3d. Priority 4: DATABASE_URL when others absent', pRes.envKeyUsed);

  // Test 4: Empty or whitespace-only values (should be skipped to next valid priority)
  clearMongoEnv();
  process.env.MONGODB_URI = '   ';
  process.env.MONGODB_URL = '  ';
  process.env.MONGO_URL = 'mongodb+srv://user:pass@cluster.mongodb.net/db_mongo_url';
  const whitespaceRes = resolveMongoUri();
  assert(
    whitespaceRes.envKeyUsed === 'MONGO_URL' && whitespaceRes.isValid === true,
    '4. Whitespace-Only Higher Priority Skipped',
    `Resolved: ${whitespaceRes.envKeyUsed}`
  );

  // Test 5: Invalid higher-priority value (must NOT silently fall back to lower-priority)
  clearMongoEnv();
  process.env.MONGODB_URI = 'postgres://user:pass@localhost:5432/mydb'; // Invalid scheme for MongoDB
  process.env.MONGODB_URL = 'mongodb+srv://user:pass@cluster.mongodb.net/valid_url';
  const invalidHigherRes = resolveMongoUri();
  assert(
    invalidHigherRes.envKeyUsed === 'MONGODB_URI' &&
    invalidHigherRes.isValid === false &&
    invalidHigherRes.error.includes("Invalid MongoDB URI scheme in 'MONGODB_URI'"),
    '5. Invalid Higher Priority Reports Error (No Silent Fallback)',
    invalidHigherRes.error
  );

  // Test 6: Malformed scheme
  clearMongoEnv();
  process.env.MONGODB_URL = 'http://cluster.mongodb.net/db';
  const malformedRes = resolveMongoUri();
  assert(malformedRes.isValid === false && malformedRes.isConfigured === true, '6. Malformed Scheme Rejected', malformedRes.error);

  // Test 7: Credentials sanitization
  const rawWithSecret = 'mongodb+srv://admin_siraj:P@ssw0rd!#%26@cluster0.net/burhanstore?retryWrites=true';
  const sanitized = sanitizeMongoUri(rawWithSecret);
  assert(
    !sanitized.includes('P@ssw0rd!#%26') && sanitized.includes('****') && sanitized.includes('admin_siraj'),
    '7. URI Password Masking',
    sanitized
  );

  // Test 8: Error message sanitization
  const rawError = 'MongoServerError: connection to mongodb+srv://admin:SecretPass123@cluster0.net/db timed out';
  const cleanError = sanitizeMongoError(rawError);
  assert(
    !cleanError.includes('SecretPass123') && cleanError.includes('****'),
    '8. Error Message Sanitization',
    cleanError
  );

} finally {
  // Restore original environment
  clearMongoEnv();
  for (const [k, v] of Object.entries(originalEnv)) {
    if (v !== undefined) process.env[k] = v;
  }
}

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
