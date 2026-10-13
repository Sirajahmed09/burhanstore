function normalizeForComparison(value) {
  if (Array.isArray(value)) return value.map(normalizeForComparison);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = normalizeForComparison(value[key]);
      return result;
    }, {});
  }
  return value;
}

function valuesEqual(left, right) {
  return JSON.stringify(normalizeForComparison(left)) === JSON.stringify(normalizeForComparison(right));
}

export function snapshotApprovalFields(existing, proposedChanges) {
  const snapshot = {};
  for (const field of Object.keys(proposedChanges || {})) {
    snapshot[field] = existing?.[field];
  }
  return snapshot;
}

export function findApprovalConflicts(currentProduct, approval) {
  const proposedChanges = approval?.proposedChanges || {};
  const snapshot = approval?.currentData || {};

  return Object.keys(proposedChanges).filter((field) => {
    // Older approval records did not snapshot every safe field. Preserve compatibility
    // by enforcing optimistic concurrency only where a snapshot exists.
    if (!Object.prototype.hasOwnProperty.call(snapshot, field)) return false;
    return !valuesEqual(currentProduct?.[field], snapshot[field]);
  });
}
