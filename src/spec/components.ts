/**
 * Wireweave DSL Component Definitions
 *
 * Complete list of all valid components in Wireweave DSL.
 * Each component specifies its valid attributes.
 */

import type { ComponentSpec } from './types';
import { COMMON_ATTRIBUTES } from './attributes';

/**
 * All valid components in Wireweave DSL
 */
export const COMPONENT_SPECS: readonly ComponentSpec[] = [
  // ============================================
  // Layout Components
  // ============================================
  {
    name: 'page',
    nodeType: 'Page',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'title', 'width', 'height', 'viewport', 'device', 'centered'],
    hasChildren: true,
    description: 'Root container for a wireframe page',
  },
  {
    name: 'header',
    nodeType: 'Header',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'border'],
    hasChildren: true,
    description: 'Page header section',
  },
  {
    name: 'main',
    nodeType: 'Main',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'scroll'],
    hasChildren: true,
    description: 'Main content section',
  },
  {
    name: 'footer',
    nodeType: 'Footer',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'border'],
    hasChildren: true,
    description: 'Page footer section',
  },
  {
    name: 'sidebar',
    nodeType: 'Sidebar',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'position', 'border', 'bg'],
    hasChildren: true,
    description: 'Side navigation or content area',
  },
  {
    name: 'section',
    nodeType: 'Section',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'title', 'expanded'],
    hasChildren: true,
    description: 'Grouped content section',
  },

  // ============================================
  // Grid Components
  // ============================================
  {
    name: 'row',
    nodeType: 'Row',
    category: 'grid',
    attributes: [...COMMON_ATTRIBUTES, 'border', 'bg'],
    hasChildren: true,
    description: 'Horizontal flex container',
  },
  {
    name: 'col',
    nodeType: 'Col',
    category: 'grid',
    attributes: [...COMMON_ATTRIBUTES, 'sm', 'md', 'lg', 'xl', 'order', 'border', 'bg', 'scroll'],
    hasChildren: true,
    description: 'Vertical flex container or grid column',
  },

  // ============================================
  // Container Components
  // ============================================
  {
    name: 'card',
    nodeType: 'Card',
    category: 'container',
    attributes: [...COMMON_ATTRIBUTES, 'title', 'shadow', 'border', 'rounded'],
    hasChildren: true,
    description: 'Card container with optional title',
  },
  {
    name: 'modal',
    nodeType: 'Modal',
    category: 'container',
    attributes: [...COMMON_ATTRIBUTES, 'title'],
    hasChildren: true,
    description: 'Modal dialog overlay',
  },
  {
    name: 'drawer',
    nodeType: 'Drawer',
    category: 'container',
    attributes: [...COMMON_ATTRIBUTES, 'title', 'position'],
    hasChildren: true,
    description: 'Slide-in drawer panel',
  },
  {
    name: 'accordion',
    nodeType: 'Accordion',
    category: 'container',
    attributes: [...COMMON_ATTRIBUTES, 'title'],
    hasChildren: true,
    description: 'Collapsible sections container',
  },

  // ============================================
  // Text Components
  // ============================================
  {
    name: 'text',
    nodeType: 'Text',
    category: 'text',
    attributes: [...COMMON_ATTRIBUTES, 'size', 'weight', 'muted', 'bold'],
    hasChildren: false,
    description: 'Text content',
  },
  {
    name: 'title',
    nodeType: 'Title',
    category: 'text',
    attributes: [...COMMON_ATTRIBUTES, 'level', 'size'],
    hasChildren: false,
    description: 'Heading element (h1-h6)',
  },
  {
    name: 'link',
    nodeType: 'Link',
    category: 'text',
    attributes: [...COMMON_ATTRIBUTES, 'href', 'external'],
    hasChildren: false,
    description: 'Hyperlink text',
  },

  // ============================================
  // Input Components
  // ============================================
  {
    name: 'input',
    nodeType: 'Input',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'inputType', 'placeholder', 'value', 'disabled', 'required', 'readonly', 'icon', 'size', 'rounded'],
    hasChildren: false,
    description: 'Text input field',
  },
  {
    name: 'textarea',
    nodeType: 'Textarea',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'placeholder', 'value', 'rows', 'disabled', 'required'],
    hasChildren: false,
    description: 'Multi-line text input',
  },
  {
    name: 'select',
    nodeType: 'Select',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'placeholder', 'value', 'disabled', 'required'],
    hasChildren: false,
    description: 'Dropdown select',
  },
  {
    name: 'checkbox',
    nodeType: 'Checkbox',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'checked', 'disabled'],
    hasChildren: false,
    description: 'Checkbox input',
  },
  {
    name: 'radio',
    nodeType: 'Radio',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'name', 'checked', 'disabled'],
    hasChildren: false,
    description: 'Radio button input',
  },
  {
    name: 'switch',
    nodeType: 'Switch',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'checked', 'disabled'],
    hasChildren: false,
    description: 'Toggle switch',
  },
  {
    name: 'slider',
    nodeType: 'Slider',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'min', 'max', 'value', 'step', 'disabled'],
    hasChildren: false,
    description: 'Range slider',
  },
  {
    name: 'button',
    nodeType: 'Button',
    category: 'input',
    attributes: [...COMMON_ATTRIBUTES, 'primary', 'secondary', 'outline', 'ghost', 'danger', 'size', 'icon', 'disabled', 'loading'],
    hasChildren: false,
    description: 'Clickable button',
  },

  // ============================================
  // Display Components
  // ============================================
  {
    name: 'image',
    nodeType: 'Image',
    category: 'display',
    attributes: [...COMMON_ATTRIBUTES, 'src', 'alt'],
    hasChildren: false,
    description: 'Image placeholder',
  },
  {
    name: 'placeholder',
    nodeType: 'Placeholder',
    category: 'display',
    attributes: [...COMMON_ATTRIBUTES, 'label'],
    hasChildren: true,
    description: 'Generic placeholder',
  },
  {
    name: 'avatar',
    nodeType: 'Avatar',
    category: 'display',
    attributes: [...COMMON_ATTRIBUTES, 'name', 'src', 'size'],
    hasChildren: false,
    description: 'User avatar',
  },
  {
    name: 'badge',
    nodeType: 'Badge',
    category: 'display',
    attributes: [...COMMON_ATTRIBUTES, 'variant', 'pill', 'icon', 'size'],
    hasChildren: false,
    description: 'Status badge',
  },
  {
    name: 'icon',
    nodeType: 'Icon',
    category: 'display',
    attributes: [...COMMON_ATTRIBUTES, 'name', 'size', 'muted'],
    hasChildren: false,
    description: 'Lucide icon',
  },

  // ============================================
  // Data Components
  // ============================================
  {
    name: 'table',
    nodeType: 'Table',
    category: 'data',
    attributes: [...COMMON_ATTRIBUTES, 'striped', 'bordered', 'hover'],
    hasChildren: false,
    description: 'Data table',
  },
  {
    name: 'list',
    nodeType: 'List',
    category: 'data',
    attributes: [...COMMON_ATTRIBUTES, 'ordered', 'none'],
    hasChildren: false,
    description: 'List of items',
  },

  // ============================================
  // Feedback Components
  // ============================================
  {
    name: 'alert',
    nodeType: 'Alert',
    category: 'feedback',
    attributes: [...COMMON_ATTRIBUTES, 'variant', 'dismissible', 'icon'],
    hasChildren: false,
    description: 'Alert message',
  },
  {
    name: 'toast',
    nodeType: 'Toast',
    category: 'feedback',
    attributes: [...COMMON_ATTRIBUTES, 'position', 'variant'],
    hasChildren: false,
    description: 'Toast notification',
  },
  {
    name: 'progress',
    nodeType: 'Progress',
    category: 'feedback',
    attributes: [...COMMON_ATTRIBUTES, 'value', 'max', 'label', 'indeterminate'],
    hasChildren: false,
    description: 'Progress bar',
  },
  {
    name: 'spinner',
    nodeType: 'Spinner',
    category: 'feedback',
    attributes: [...COMMON_ATTRIBUTES, 'label', 'size'],
    hasChildren: false,
    description: 'Loading spinner',
  },

  // ============================================
  // Overlay Components
  // ============================================
  {
    name: 'tooltip',
    nodeType: 'Tooltip',
    category: 'overlay',
    attributes: [...COMMON_ATTRIBUTES, 'position'],
    hasChildren: false,
    description: 'Tooltip on hover',
  },
  {
    name: 'popover',
    nodeType: 'Popover',
    category: 'overlay',
    attributes: [...COMMON_ATTRIBUTES, 'title'],
    hasChildren: true,
    description: 'Popover panel',
  },
  {
    name: 'dropdown',
    nodeType: 'Dropdown',
    category: 'overlay',
    attributes: [...COMMON_ATTRIBUTES],
    hasChildren: false,
    description: 'Dropdown menu',
  },

  // ============================================
  // Navigation Components
  // ============================================
  {
    name: 'nav',
    nodeType: 'Nav',
    category: 'navigation',
    attributes: [...COMMON_ATTRIBUTES, 'vertical'],
    hasChildren: false,
    description: 'Navigation menu',
  },
  {
    name: 'tabs',
    nodeType: 'Tabs',
    category: 'navigation',
    attributes: [...COMMON_ATTRIBUTES, 'active'],
    hasChildren: true,
    description: 'Tab navigation',
  },
  {
    name: 'breadcrumb',
    nodeType: 'Breadcrumb',
    category: 'navigation',
    attributes: [...COMMON_ATTRIBUTES],
    hasChildren: false,
    description: 'Breadcrumb navigation',
  },

  // ============================================
  // Divider Component
  // ============================================
  {
    name: 'divider',
    nodeType: 'Divider',
    category: 'layout',
    attributes: [...COMMON_ATTRIBUTES, 'vertical'],
    hasChildren: false,
    description: 'Horizontal separator',
  },
] as const;

/**
 * Set of all valid component names for quick lookup
 */
export const VALID_COMPONENT_NAMES: ReadonlySet<string> = new Set(
  COMPONENT_SPECS.map(comp => comp.name)
);

/**
 * Map of component name to spec for quick lookup
 */
export const COMPONENT_MAP: ReadonlyMap<string, ComponentSpec> = new Map(
  COMPONENT_SPECS.map(comp => [comp.name, comp])
);

/**
 * Map of AST node type to spec for quick lookup
 */
export const NODE_TYPE_MAP: ReadonlyMap<string, ComponentSpec> = new Map(
  COMPONENT_SPECS.map(comp => [comp.nodeType, comp])
);

/**
 * Get valid attributes for a component (by name or node type)
 */
export function getValidAttributes(componentNameOrType: string): readonly string[] | undefined {
  const spec = COMPONENT_MAP.get(componentNameOrType) ?? NODE_TYPE_MAP.get(componentNameOrType);
  return spec?.attributes;
}

/**
 * Check if an attribute is valid for a component
 */
export function isValidAttribute(componentNameOrType: string, attributeName: string): boolean {
  const validAttrs = getValidAttributes(componentNameOrType);
  if (!validAttrs) return false;
  return validAttrs.includes(attributeName);
}
