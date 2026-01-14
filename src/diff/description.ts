/**
 * Description generation for diff engine
 */

import type { NodeChange } from './types';

/**
 * Generate human-readable description of changes
 */
export function generateDescription(changes: NodeChange[]): string {
  if (changes.length === 0) {
    return 'No changes detected.';
  }

  const parts: string[] = [];

  const added = changes.filter(c => c.type === 'added');
  const removed = changes.filter(c => c.type === 'removed');
  const changed = changes.filter(c => c.type === 'changed');
  const moved = changes.filter(c => c.type === 'moved');

  if (added.length > 0) {
    parts.push(`Added ${added.length} component(s): ${added.map(c => c.nodeType).join(', ')}`);
  }
  if (removed.length > 0) {
    parts.push(`Removed ${removed.length} component(s): ${removed.map(c => c.nodeType).join(', ')}`);
  }
  if (changed.length > 0) {
    parts.push(`Modified ${changed.length} component(s)`);
  }
  if (moved.length > 0) {
    parts.push(`Reordered ${moved.length} component(s)`);
  }

  return parts.join('. ') + '.';
}
