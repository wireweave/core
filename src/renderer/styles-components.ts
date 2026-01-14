/**
 * Component-specific CSS styles for wireweave
 *
 * Detailed styles for all UI components with:
 * - Wireframe aesthetic (black/white/gray)
 * - Accessibility considerations
 * - Responsive design
 */

import type { ThemeConfig } from './types';
import {
  generateContainerStyles,
  generateTextStyles,
  generateInputStyles,
  generateButtonStyles,
  generateDisplayStyles,
  generateDataStyles,
  generateFeedbackStyles,
  generateOverlayStyles,
  generateNavigationStyles,
  generateSemanticMarkerStyles,
  generateAccessibilityStyles,
} from './styles/index';

/**
 * Generate all component-specific CSS styles
 */
export function generateComponentStyles(_theme: ThemeConfig, prefix: string = 'wf'): string {
  const parts: string[] = [
    generateContainerStyles(prefix),
    generateTextStyles(prefix),
    generateInputStyles(_theme, prefix),
    generateButtonStyles(_theme, prefix),
    generateDisplayStyles(_theme, prefix),
    generateDataStyles(_theme, prefix),
    generateFeedbackStyles(_theme, prefix),
    generateOverlayStyles(_theme, prefix),
    generateNavigationStyles(_theme, prefix),
    generateSemanticMarkerStyles(_theme, prefix),
    generateAccessibilityStyles(prefix),
  ];

  return parts.join('\n\n');
}
