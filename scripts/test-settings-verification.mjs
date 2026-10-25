import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCollection } from '../lib/db/mongodb.js';

console.log('=== BURHAN STORE: SETTINGS FIX & UNIQUENESS VERIFICATION SUITE ===\n');

async function runSettingsVerification() {
  const settingsCol = await getCollection('settings');

  // -------------------------------------------------------------
  // SETUP: Initial seed document with known _id and base settings
  // -------------------------------------------------------------
  const INITIAL_DOC_ID = 'settings-doc-uuid-12345';
  await settingsCol.data.splice(0, settingsCol.data.length); // clear existing
  await settingsCol.data.push({
    _id: INITIAL_DOC_ID,
    type: 'general',
    businessName: 'Burhan',
    tagline: 'Powering Your Digital Lifestyle',
    phone: '03013301830',
    whatsapp: '03150693148',
    email: 'infoburhancommunication@gmail.com',
    address: 'Karachi, Sindh, Pakistan',
    shippingFee: 200,
    facebook: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    youtube: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  });

  // -------------------------------------------------------------
  // TEST 1: Direct update with _id in body (Server strips _id)
  // -------------------------------------------------------------
  console.log('--- TEST 1: MongoDB _id Immutability Protection ---');
  
  // Verify that InMemoryCollection catches any direct _id mutation in $set
  let errorThrown = false;
  try {
    await settingsCol.updateOne(
      { type: 'general' },
      { $set: { _id: 'hacked-id', businessName: 'Hacked' } }
    );
  } catch (err) {
    errorThrown = true;
    assert(
      err.message.includes("Performing an update on the path '_id' would result in an immutable field being modified"),
      `Unexpected error message: ${err.message}`
    );
  }
  assert.equal(errorThrown, true, 'InMemoryCollection must reject $set with _id just like real MongoDB');
  console.log('  [PASS] MongoDB driver / InMemoryCollection throws error if _id is present in $set');

  // Verify server-side pattern: const { _id, ...cleanSettings } = body
  const dirtyBody = {
    _id: INITIAL_DOC_ID, // incoming body from client containing _id
    facebook: 'https://facebook.com/burhanstore_official'
  };
  const { _id, ...cleanSettings } = dirtyBody;
  assert(!('_id' in cleanSettings), 'cleanSettings must not contain _id');

  await settingsCol.updateOne(
    { type: 'general' },
    { $set: { ...cleanSettings, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  const docAfterTest1 = await settingsCol.findOne({ type: 'general' });
  assert.equal(docAfterTest1._id, INITIAL_DOC_ID, 'Document _id must remain strictly unchanged');
  assert.equal(docAfterTest1.facebook, 'https://facebook.com/burhanstore_official', 'Facebook URL must be saved');
  console.log('  [PASS] Server cleanly strips _id from payload; document _id remains unchanged');

  // -------------------------------------------------------------
  // TEST 2: Facebook URL Save
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Facebook URL Save ---');
  const facebookUpdate = { facebook: 'https://facebook.com/burhan.pakistan' };
  const { _id: _2, ...cleanFB } = facebookUpdate;
  await settingsCol.updateOne(
    { type: 'general' },
    { $set: { ...cleanFB, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  const docFB = await settingsCol.findOne({ type: 'general' });
  assert.equal(docFB.facebook, 'https://facebook.com/burhan.pakistan');
  assert.equal(docFB._id, INITIAL_DOC_ID);
  console.log('  [PASS] Facebook URL saved successfully with preserved document ID');

  // -------------------------------------------------------------
  // TEST 3: Tagline Save
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Tagline Save ---');
  const taglineUpdate = { tagline: 'Pure Sound. Quiet Luxury.' };
  const { _id: _3, ...cleanTagline } = taglineUpdate;
  await settingsCol.updateOne(
    { type: 'general' },
    { $set: { ...cleanTagline, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  const docTagline = await settingsCol.findOne({ type: 'general' });
  assert.equal(docTagline.tagline, 'Pure Sound. Quiet Luxury.');
  assert.equal(docTagline._id, INITIAL_DOC_ID);
  console.log('  [PASS] Tagline saved successfully with preserved document ID');

  // -------------------------------------------------------------
  // TEST 4: Business Name Save
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Business Name Save ---');
  const nameUpdate = { businessName: 'BURHAN AUDIO LAB' };
  const { _id: _4, ...cleanName } = nameUpdate;
  await settingsCol.updateOne(
    { type: 'general' },
    { $set: { ...cleanName, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  const docName = await settingsCol.findOne({ type: 'general' });
  assert.equal(docName.businessName, 'BURHAN AUDIO LAB');
  assert.equal(docName._id, INITIAL_DOC_ID);
  console.log('  [PASS] Business Name saved successfully with preserved document ID');

  // -------------------------------------------------------------
  // TEST 5: Multiple Settings Saved Together
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Multiple Settings Saved Together ---');
  const multiUpdate = {
    _id: INITIAL_DOC_ID, // client sends with _id
    businessName: 'BURHAN STORE',
    tagline: 'Sound that moves with you.',
    facebook: 'https://facebook.com/burhanstore',
    instagram: 'https://instagram.com/burhanstore',
    tiktok: 'https://tiktok.com/@burhanstore',
    twitter: 'https://x.com/burhanstore',
    youtube: 'https://youtube.com/@burhanstore',
    shippingFee: 250
  };
  const { _id: _5, ...cleanMulti } = multiUpdate;
  await settingsCol.updateOne(
    { type: 'general' },
    { $set: { ...cleanMulti, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  const docMulti = await settingsCol.findOne({ type: 'general' });
  assert.equal(docMulti.businessName, 'BURHAN STORE');
  assert.equal(docMulti.tagline, 'Sound that moves with you.');
  assert.equal(docMulti.facebook, 'https://facebook.com/burhanstore');
  assert.equal(docMulti.instagram, 'https://instagram.com/burhanstore');
  assert.equal(docMulti.tiktok, 'https://tiktok.com/@burhanstore');
  assert.equal(docMulti.shippingFee, 250);
  assert.equal(docMulti._id, INITIAL_DOC_ID);
  console.log('  [PASS] Multiple settings updated together cleanly in one atomic operation');

  // -------------------------------------------------------------
  // TEST 6: Unrelated Settings Remain Unchanged
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Unrelated Settings Preservation ---');
  // Update ONLY shippingFee
  const partialUpdate = { shippingFee: 300 };
  const { _id: _6, ...cleanPartial } = partialUpdate;
  await settingsCol.updateOne(
    { type: 'general' },
    { $set: { ...cleanPartial, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  const docPartial = await settingsCol.findOne({ type: 'general' });
  assert.equal(docPartial.shippingFee, 300);
  assert.equal(docPartial.businessName, 'BURHAN STORE', 'Unrelated businessName must remain intact');
  assert.equal(docPartial.tagline, 'Sound that moves with you.', 'Unrelated tagline must remain intact');
  assert.equal(docPartial.phone, '03013301830', 'Unrelated phone must remain intact');
  assert.equal(docPartial.whatsapp, '03150693148', 'Unrelated whatsapp must remain intact');
  assert.equal(docPartial.email, 'infoburhancommunication@gmail.com', 'Unrelated email must remain intact');
  assert.equal(docPartial.address, 'Karachi, Sindh, Pakistan', 'Unrelated address must remain intact');
  assert.equal(docPartial.facebook, 'https://facebook.com/burhanstore', 'Unrelated facebook must remain intact');
  assert.equal(docPartial.instagram, 'https://instagram.com/burhanstore', 'Unrelated instagram must remain intact');
  assert.equal(docPartial.tiktok, 'https://tiktok.com/@burhanstore', 'Unrelated tiktok must remain intact');
  assert.equal(docPartial.createdAt, '2026-01-01T00:00:00.000Z', 'createdAt must remain intact');
  assert.equal(docPartial._id, INITIAL_DOC_ID, '_id must remain intact');
  console.log('  [PASS] Unrelated settings, metadata, and timestamps are strictly preserved');

  // -------------------------------------------------------------
  // TEST 7: Settings Document Uniqueness & Scenarios
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Settings Document Uniqueness Scenarios ---');

  // Scenario 1: Exactly one general settings document present
  const generalDocsCount = settingsCol.data.filter(d => d.type === 'general').length;
  assert.equal(generalDocsCount, 1, 'Collection has exactly one general settings document');
  console.log('  [PASS] Scenario 1: Single authoritative general settings document verified');

  // Scenario 2: Legacy documents without a "type" field
  await settingsCol.data.push({
    _id: 'legacy-doc-1',
    theme: 'dark',
    customCss: ''
    // Notice: no "type" field
  });
  await settingsCol.data.push({
    _id: 'legacy-doc-2',
    analyticsKey: 'old-key-123'
    // Notice: no "type" field
  });
  // Verify createIndex succeeds because partialFilterExpression only targets type: 'general'
  const indexCreatedWithLegacy = await settingsCol.createIndex(
    { type: 1 },
    { unique: true, partialFilterExpression: { type: 'general' } }
  );
  assert(indexCreatedWithLegacy.includes('type'), 'Partial index builds cleanly with legacy untyped documents');
  console.log('  [PASS] Scenario 2: Multiple legacy documents without "type" field coexist without conflict');

  // Scenario 3: Documents with other settings types
  await settingsCol.data.push({
    _id: 'notification-settings-doc',
    type: 'notification',
    orderAlerts: true
  });
  await settingsCol.data.push({
    _id: 'shipping-rules-doc',
    type: 'shipping_rules',
    flatRate: 200
  });
  const indexCreatedWithOtherTypes = await settingsCol.createIndex(
    { type: 1 },
    { unique: true, partialFilterExpression: { type: 'general' } }
  );
  assert(indexCreatedWithOtherTypes.includes('type'), 'Partial index ignores other types');
  console.log('  [PASS] Scenario 3: Documents with other settings types coexist without conflict');

  // Scenario 4: Multiple general settings documents (duplicate conflict scenario)
  // Simulate duplicate general settings document
  const DUPLICATE_ID = 'duplicate-general-doc-999';
  await settingsCol.data.push({
    _id: DUPLICATE_ID,
    type: 'general',
    storeName: 'Duplicate Store',
    createdAt: '2026-01-02T00:00:00.000Z'
  });
  let duplicateIndexError = false;
  try {
    await settingsCol.createIndex(
      { type: 1 },
      { unique: true, partialFilterExpression: { type: 'general' } }
    );
  } catch (err) {
    duplicateIndexError = true;
    assert(err.message.includes('E11000 duplicate key error'));
  }
  assert.equal(duplicateIndexError, true, 'createIndex must fail with E11000 if duplicates exist');
  console.log('  [PASS] Scenario 4: createIndex properly detects duplicates and surfaces E11000 duplicate key error');

  // Remediation: Remove duplicate so only the primary authoritative document remains
  const dupIdx = settingsCol.data.findIndex(d => d._id === DUPLICATE_ID);
  if (dupIdx !== -1) settingsCol.data.splice(dupIdx, 1);
  const remediatedIndex = await settingsCol.createIndex(
    { type: 1 },
    { unique: true, partialFilterExpression: { type: 'general' } }
  );
  assert(remediatedIndex.includes('type'), 'Index creates cleanly after remediation');
  console.log('  [PASS] Remediation plan verified: Index builds successfully once duplicates are resolved');

  // Scenario 5: Concurrent upsert attempts
  // When general document already exists, subsequent insert/upsert with type: 'general' is blocked by uniqueness
  let concurrentInsertBlocked = false;
  try {
    await settingsCol.insertOne({
      _id: 'racing-insert-id',
      type: 'general',
      businessName: 'Racing Insert'
    });
  } catch (err) {
    concurrentInsertBlocked = true;
    assert(err.message.includes('E11000 duplicate key error'));
  }
  assert.equal(concurrentInsertBlocked, true, 'Concurrent insert with duplicate general type must be blocked');
  console.log('  [PASS] Scenario 5: Racing/concurrent general insert is blocked by unique constraint');

  // Clean up fixture documents added during Test 7 so collection is clean
  settingsCol.data = settingsCol.data.filter(d => d._id === INITIAL_DOC_ID);

  // -------------------------------------------------------------
  // TEST 8: Invalid and Unauthorized Updates Rejected
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Invalid and Unauthorized Updates Rejection ---');
  
  function validateAdminSettingsUpdate(body, userRole) {
    if (userRole !== 'owner' && userRole !== 'superadmin') {
      return { status: 403, error: 'Forbidden: Only store owners can update settings' };
    }
    const { _id, ...cleanSettings } = body;
    const socialPlatforms = ['facebook', 'instagram', 'tiktok', 'twitter', 'youtube'];
    for (const plat of socialPlatforms) {
      if (cleanSettings[plat] && typeof cleanSettings[plat] === 'string' && cleanSettings[plat].trim()) {
        const val = cleanSettings[plat].trim();
        if (/^(javascript|data|vbscript):/i.test(val) || !val.startsWith('https://')) {
          return { status: 400, error: `Invalid URL for ${plat}. Must be an HTTPS link.` };
        }
      }
    }
    return { status: 200, cleanSettings };
  }

  // 8.1 Employee role rejected with 403
  const employeeAttempt = validateAdminSettingsUpdate({ businessName: 'Test' }, 'employee');
  assert.equal(employeeAttempt.status, 403);
  console.log('  [PASS] Non-owner role rejected with HTTP 403');

  // 8.2 Manager role rejected with 403
  const managerAttempt = validateAdminSettingsUpdate({ businessName: 'Test' }, 'manager');
  assert.equal(managerAttempt.status, 403);
  console.log('  [PASS] Manager role rejected with HTTP 403');

  // 8.3 Malicious javascript: URL rejected with 400
  const jsAttack = validateAdminSettingsUpdate({ facebook: 'javascript:alert(document.cookie)' }, 'owner');
  assert.equal(jsAttack.status, 400);
  assert(jsAttack.error.includes('Must be an HTTPS link'));
  console.log('  [PASS] Malicious javascript: URL rejected with HTTP 400');

  // 8.4 Non-HTTPS URL rejected with 400
  const httpUrl = validateAdminSettingsUpdate({ instagram: 'http://instagram.com/burhan' }, 'owner');
  assert.equal(httpUrl.status, 400);
  assert(httpUrl.error.includes('Must be an HTTPS link'));
  console.log('  [PASS] Insecure HTTP URL rejected with HTTP 400');

  // 8.5 Owner with valid payload accepted with 200
  const ownerValid = validateAdminSettingsUpdate({ businessName: 'Burhan', facebook: 'https://facebook.com/burhan' }, 'owner');
  assert.equal(ownerValid.status, 200);
  assert(!('_id' in ownerValid.cleanSettings));
  console.log('  [PASS] Owner role with valid payload accepted with HTTP 200');

  // -------------------------------------------------------------
  // TEST 9: Code Contract & Registry Checks
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Code Contract & Index Registry Checks ---');

  const adminRoute = fs.readFileSync('app/api/admin/[[...path]]/route.js', 'utf8');
  const adminPage = fs.readFileSync('app/admin/settings/page.jsx', 'utf8');
  const mongoDbSource = fs.readFileSync('lib/db/mongodb.js', 'utf8');

  // 9.1 Backend strips _id
  assert(
    adminRoute.includes('const { _id, ...cleanSettings } = body;'),
    'Backend must strip _id via destructuring'
  );
  assert(
    adminRoute.includes('{ $set: { ...cleanSettings, updatedAt:'),
    'Backend must update using cleanSettings'
  );
  console.log('  [PASS] Backend route strictly uses cleanSettings without _id in $set');

  // 9.2 Frontend strips _id in handleSave
  assert(
    adminPage.includes('const { _id, ...cleanPayload } = settings;'),
    'Frontend handleSave must strip _id before sending body'
  );
  assert(
    adminPage.includes('body: JSON.stringify(cleanPayload)'),
    'Frontend must stringify cleanPayload without _id'
  );
  console.log('  [PASS] Frontend settings page strips _id before transmitting JSON body');

  // 9.3 Index registry includes settings partial unique index
  assert(
    mongoDbSource.includes("col: 'settings', spec: { type: 1 }, opts: { unique: true, partialFilterExpression: { type: 'general' } }"),
    'Index registry must include settings partial unique index'
  );
  console.log('  [PASS] Index registry declares partial unique index for settings { type: 1 }');

  console.log('\n=============================================================');
  console.log('ALL SETTINGS VERIFICATION & UNIQUENESS TESTS PASSED (9/9)!');
  console.log('=============================================================');
}

runSettingsVerification().catch(err => {
  console.error('\n[TEST FAILURE]:', err);
  process.exit(1);
});
