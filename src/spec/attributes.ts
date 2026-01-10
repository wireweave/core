/**
 * Wireweave DSL Attribute Definitions
 *
 * Complete list of all valid attributes in Wireweave DSL.
 */

import type { AttributeSpec } from './types';

/**
 * All valid attributes in Wireweave DSL
 */
export const ATTRIBUTE_SPECS: readonly AttributeSpec[] = [
  // ============================================
  // Spacing Attributes
  // ============================================
  { name: 'p', type: 'number', description: 'Padding (all sides)' },
  { name: 'px', type: 'number', description: 'Horizontal padding' },
  { name: 'py', type: 'number', description: 'Vertical padding' },
  { name: 'pt', type: 'number', description: 'Top padding' },
  { name: 'pr', type: 'number', description: 'Right padding' },
  { name: 'pb', type: 'number', description: 'Bottom padding' },
  { name: 'pl', type: 'number', description: 'Left padding' },
  { name: 'm', type: 'number', description: 'Margin (all sides)' },
  { name: 'mx', type: 'string', description: 'Horizontal margin (number or "auto")' },
  { name: 'my', type: 'number', description: 'Vertical margin' },
  { name: 'mt', type: 'number', description: 'Top margin' },
  { name: 'mr', type: 'number', description: 'Right margin' },
  { name: 'mb', type: 'number', description: 'Bottom margin' },
  { name: 'ml', type: 'number', description: 'Left margin' },
  { name: 'gap', type: 'number', description: 'Gap between children' },

  // ============================================
  // Size Attributes
  // ============================================
  { name: 'w', type: 'string', description: 'Width (number, "full", "auto", "screen", "fit")' },
  { name: 'h', type: 'string', description: 'Height (number, "full", "auto", "screen")' },
  { name: 'width', type: 'number', description: 'Width in pixels (page only)' },
  { name: 'height', type: 'number', description: 'Height in pixels (page only)' },
  { name: 'minW', type: 'number', description: 'Minimum width' },
  { name: 'maxW', type: 'number', description: 'Maximum width' },
  { name: 'minH', type: 'number', description: 'Minimum height' },
  { name: 'maxH', type: 'number', description: 'Maximum height' },

  // ============================================
  // Flex/Grid Layout Attributes
  // ============================================
  { name: 'flex', type: 'boolean', description: 'Enable flexbox' },
  { name: 'direction', type: 'enum', values: ['row', 'column', 'row-reverse', 'column-reverse'], description: 'Flex direction' },
  { name: 'justify', type: 'enum', values: ['start', 'center', 'end', 'between', 'around', 'evenly'], description: 'Main axis alignment' },
  { name: 'align', type: 'enum', values: ['start', 'center', 'end', 'stretch', 'baseline'], description: 'Cross axis alignment' },
  { name: 'wrap', type: 'boolean', description: 'Enable flex wrap' },
  { name: 'span', type: 'number', description: 'Grid column span (1-12)' },
  { name: 'sm', type: 'number', description: 'Responsive span at 576px+' },
  { name: 'md', type: 'number', description: 'Responsive span at 768px+' },
  { name: 'lg', type: 'number', description: 'Responsive span at 992px+' },
  { name: 'xl', type: 'number', description: 'Responsive span at 1200px+' },
  { name: 'order', type: 'number', description: 'Flex order' },

  // ============================================
  // Position Attributes
  // ============================================
  { name: 'x', type: 'number', description: 'Horizontal position' },
  { name: 'y', type: 'number', description: 'Vertical position' },
  { name: 'position', type: 'enum', values: ['left', 'right', 'top', 'bottom', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'], description: 'Position preset' },

  // ============================================
  // Visual Attributes
  // ============================================
  { name: 'border', type: 'boolean', description: 'Show border' },
  { name: 'rounded', type: 'boolean', description: 'Apply border radius' },
  { name: 'shadow', type: 'enum', values: ['none', 'sm', 'md', 'lg', 'xl'], description: 'Box shadow' },
  { name: 'bg', type: 'enum', values: ['muted', 'primary', 'secondary'], description: 'Background variant' },

  // ============================================
  // Text Attributes
  // ============================================
  { name: 'size', type: 'enum', values: ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'], description: 'Size preset' },
  { name: 'weight', type: 'enum', values: ['normal', 'medium', 'semibold', 'bold'], description: 'Font weight' },
  { name: 'level', type: 'number', description: 'Heading level (1-6)' },
  { name: 'muted', type: 'boolean', description: 'Muted/dimmed style' },
  { name: 'bold', type: 'boolean', description: 'Bold text' },

  // ============================================
  // Button Variant Attributes
  // ============================================
  { name: 'primary', type: 'boolean', description: 'Primary style' },
  { name: 'secondary', type: 'boolean', description: 'Secondary style' },
  { name: 'outline', type: 'boolean', description: 'Outline style' },
  { name: 'ghost', type: 'boolean', description: 'Ghost/transparent style' },
  { name: 'danger', type: 'boolean', description: 'Danger/destructive style' },

  // ============================================
  // Status Variant Attributes
  // ============================================
  { name: 'variant', type: 'enum', values: ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'], description: 'Status variant' },

  // ============================================
  // Form Attributes
  // ============================================
  { name: 'inputType', type: 'enum', values: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'], description: 'Input field type' },
  { name: 'placeholder', type: 'string', description: 'Placeholder text' },
  { name: 'value', type: 'string', description: 'Default value' },
  { name: 'label', type: 'string', description: 'Field label' },
  { name: 'name', type: 'string', description: 'Form field name' },
  { name: 'required', type: 'boolean', description: 'Required field' },
  { name: 'disabled', type: 'boolean', description: 'Disabled state' },
  { name: 'readonly', type: 'boolean', description: 'Read-only state' },
  { name: 'checked', type: 'boolean', description: 'Checked state' },
  { name: 'loading', type: 'boolean', description: 'Loading state' },
  { name: 'rows', type: 'number', description: 'Textarea rows' },
  { name: 'min', type: 'number', description: 'Minimum value' },
  { name: 'max', type: 'number', description: 'Maximum value' },
  { name: 'step', type: 'number', description: 'Step increment' },

  // ============================================
  // Content Attributes
  // ============================================
  { name: 'title', type: 'string', description: 'Title text' },
  { name: 'src', type: 'string', description: 'Source URL' },
  { name: 'alt', type: 'string', description: 'Alt text' },
  { name: 'href', type: 'string', description: 'Link URL' },
  { name: 'icon', type: 'string', description: 'Icon name' },
  { name: 'external', type: 'boolean', description: 'External link' },

  // ============================================
  // State Attributes
  // ============================================
  { name: 'active', type: 'number', description: 'Active index' },
  { name: 'expanded', type: 'boolean', description: 'Expanded state' },
  { name: 'centered', type: 'boolean', description: 'Center content' },
  { name: 'vertical', type: 'boolean', description: 'Vertical orientation' },
  { name: 'scroll', type: 'boolean', description: 'Enable scrolling' },

  // ============================================
  // Feedback Attributes
  // ============================================
  { name: 'dismissible', type: 'boolean', description: 'Can be dismissed' },
  { name: 'indeterminate', type: 'boolean', description: 'Indeterminate state' },
  { name: 'pill', type: 'boolean', description: 'Pill/rounded style' },

  // ============================================
  // Data Attributes
  // ============================================
  { name: 'striped', type: 'boolean', description: 'Striped rows' },
  { name: 'bordered', type: 'boolean', description: 'Full borders' },
  { name: 'hover', type: 'boolean', description: 'Hover effect' },
  { name: 'ordered', type: 'boolean', description: 'Ordered list' },
  { name: 'none', type: 'boolean', description: 'No list markers' },

  // ============================================
  // Page/Viewport Attributes
  // ============================================
  { name: 'viewport', type: 'string', description: 'Viewport size (e.g., "1440x900")' },
  { name: 'device', type: 'string', description: 'Device preset' },
] as const;

/**
 * Set of all valid attribute names for quick lookup
 */
export const VALID_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set(
  ATTRIBUTE_SPECS.map(attr => attr.name)
);

/**
 * Map of attribute name to spec for quick lookup
 */
export const ATTRIBUTE_MAP: ReadonlyMap<string, AttributeSpec> = new Map(
  ATTRIBUTE_SPECS.map(attr => [attr.name, attr])
);

/**
 * Common attributes available to most components
 */
export const COMMON_ATTRIBUTES: readonly string[] = [
  // Spacing
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
  'gap',
  // Size
  'w', 'h', 'minW', 'maxW', 'minH', 'maxH',
  // Flex
  'flex', 'direction', 'justify', 'align', 'wrap',
  // Grid
  'span',
  // Position
  'x', 'y',
] as const;
