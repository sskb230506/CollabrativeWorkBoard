// ─────────────────────────────────────────────────────────────────────────────
// Drag-and-Drop Position Utilities
//
// Cards and lists use Float position values (e.g. 1000, 2000).
// When an item is dropped between two others, the new position is the
// midpoint between the neighbours. This avoids re-indexing all items.
// ─────────────────────────────────────────────────────────────────────────────

const GAP = 1000;

/**
 * Calculate a new position for an item dropped at `index` within `positions`.
 */
export function calculatePosition(positions: number[], index: number): number {
  if (positions.length === 0) return GAP;

  if (index === 0) {
    // Before the first item
    const first = positions[0] ?? GAP;
    return first > 1 ? first / 2 : first - GAP;
  }

  if (index >= positions.length) {
    // After the last item
    const last = positions[positions.length - 1] ?? 0;
    return last + GAP;
  }

  const before = positions[index - 1] ?? 0;
  const after  = positions[index] ?? before + GAP;
  return (before + after) / 2;
}
