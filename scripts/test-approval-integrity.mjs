import { findApprovalConflicts, snapshotApprovalFields } from '../lib/admin/approvalIntegrity.js';

const original = {
  price: 1000,
  stock: 8,
  visible: true,
  images: ['old-image.jpg'],
  specifications: { driver: '10mm', bluetooth: '5.3' }
};

const proposed = {
  price: 900,
  stock: 12,
  visible: false,
  images: ['new-image.jpg'],
  specifications: { bluetooth: '5.4', driver: '10mm' }
};

const snapshot = snapshotApprovalFields(original, proposed);
const pendingApproval = { currentData: snapshot, proposedChanges: proposed };

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[PASS] ${message}`);
}

assert(findApprovalConflicts(original, pendingApproval).length === 0, 'Unchanged product can accept a pending approval');
assert(findApprovalConflicts({ ...original, price: 950 }, pendingApproval).includes('price'), 'Newer price blocks stale approval');
assert(findApprovalConflicts({ ...original, images: ['newer-image.jpg'] }, pendingApproval).includes('images'), 'Newer image blocks stale approval');
assert(findApprovalConflicts({ ...original, specifications: { bluetooth: '5.3', driver: '10mm' } }, pendingApproval).length === 0, 'Object key order does not create a false conflict');
assert(findApprovalConflicts({ price: 950 }, { currentData: { price: 1000 }, proposedChanges: { price: 900, images: ['new-image.jpg'] } }).length === 1, 'Legacy approvals remain compatible while enforcing available snapshots');

console.log('\n=== RESULTS: 5 PASSED, 0 FAILED ===');
