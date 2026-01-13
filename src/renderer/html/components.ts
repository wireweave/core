/**
 * Component Renderers for wireweave
 *
 * Dedicated renderers for all UI components with:
 * - XSS prevention via HTML escaping
 * - Accessibility attributes (role, aria-*)
 * - Consistent class naming
 */

import type {
  AnyNode,
  CardNode,
  ModalNode,
  DrawerNode,
  AccordionNode,
  TextNode,
  TitleNode,
  LinkNode,
  InputNode,
  TextareaNode,
  SelectNode,
  CheckboxNode,
  RadioNode,
  SwitchNode,
  SliderNode,
  ButtonNode,
  ImageNode,
  PlaceholderNode,
  AvatarNode,
  BadgeNode,
  IconNode,
  TableNode,
  ListNode,
  AlertNode,
  ToastNode,
  ProgressNode,
  SpinnerNode,
  TooltipNode,
  PopoverNode,
  DropdownNode,
  NavNode,
  TabsNode,
  BreadcrumbNode,
  DividerComponentNode,
  CommonProps,
} from '../../ast/types';
import type { RenderContext } from '../types';
import { getIconData, renderIconSvg } from '../../icons/lucide-icons';

/**
 * Type for children renderer callback (re-exported from layout)
 */
import type { ChildrenRenderer } from './layout';
export type { ChildrenRenderer };

/**
 * Component node types
 */
export type ComponentNodeType =
  | 'Card' | 'Modal' | 'Drawer' | 'Accordion'
  | 'Text' | 'Title' | 'Link'
  | 'Input' | 'Textarea' | 'Select' | 'Checkbox' | 'Radio' | 'Switch' | 'Slider'
  | 'Button'
  | 'Image' | 'Placeholder' | 'Avatar' | 'Badge' | 'Icon'
  | 'Table' | 'List'
  | 'Alert' | 'Toast' | 'Progress' | 'Spinner'
  | 'Tooltip' | 'Popover' | 'Dropdown'
  | 'Nav' | 'Tabs' | 'Breadcrumb'
  | 'Divider';

/**
 * Check if a node type is a component node
 */
export function isComponentNodeType(type: string): type is ComponentNodeType {
  const componentTypes: string[] = [
    'Card', 'Modal', 'Drawer', 'Accordion',
    'Text', 'Title', 'Link',
    'Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider',
    'Button',
    'Image', 'Placeholder', 'Avatar', 'Badge', 'Icon',
    'Table', 'List',
    'Alert', 'Toast', 'Progress', 'Spinner',
    'Tooltip', 'Popover', 'Dropdown',
    'Nav', 'Tabs', 'Breadcrumb',
    'Divider',
  ];
  return componentTypes.includes(type);
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

/**
 * Build CSS class string from an array
 */
export function buildClassString(classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Build HTML attributes string
 */
export function buildAttrsString(attrs: Record<string, string | undefined | boolean>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) {
      continue;
    }

    if (value === true) {
      parts.push(key);
    } else {
      parts.push(`${key}="${escapeHtml(value)}"`);
    }
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Get common CSS classes from props
 * Uses Omit to exclude 'align' since TextNode/TitleNode have incompatible align types
 */
export function getCommonClasses(props: Omit<Partial<CommonProps>, 'align'> & { align?: string }, prefix: string): string[] {
  const classes: string[] = [];

  // Spacing
  if (props.p !== undefined) classes.push(`${prefix}-p-${props.p}`);
  if (props.px !== undefined) classes.push(`${prefix}-px-${props.px}`);
  if (props.py !== undefined) classes.push(`${prefix}-py-${props.py}`);
  if (props.pt !== undefined) classes.push(`${prefix}-pt-${props.pt}`);
  if (props.pr !== undefined) classes.push(`${prefix}-pr-${props.pr}`);
  if (props.pb !== undefined) classes.push(`${prefix}-pb-${props.pb}`);
  if (props.pl !== undefined) classes.push(`${prefix}-pl-${props.pl}`);
  if (props.m !== undefined) classes.push(`${prefix}-m-${props.m}`);
  if (props.mx !== undefined) classes.push(`${prefix}-mx-${props.mx}`);
  if (props.my !== undefined) classes.push(`${prefix}-my-${props.my}`);
  if (props.mt !== undefined) classes.push(`${prefix}-mt-${props.mt}`);
  if (props.mr !== undefined) classes.push(`${prefix}-mr-${props.mr}`);
  if (props.mb !== undefined) classes.push(`${prefix}-mb-${props.mb}`);
  if (props.ml !== undefined) classes.push(`${prefix}-ml-${props.ml}`);

  // Size
  if (props.w === 'full') classes.push(`${prefix}-w-full`);
  if (props.w === 'auto') classes.push(`${prefix}-w-auto`);
  if (props.w === 'fit') classes.push(`${prefix}-w-fit`);
  if (props.h === 'full') classes.push(`${prefix}-h-full`);
  if (props.h === 'auto') classes.push(`${prefix}-h-auto`);
  if (props.h === 'screen') classes.push(`${prefix}-h-screen`);

  // Flex
  if (props.flex === true) classes.push(`${prefix}-flex`);
  if (typeof props.flex === 'number') classes.push(`${prefix}-flex-${props.flex}`);
  if (props.direction === 'row') classes.push(`${prefix}-flex-row`);
  if (props.direction === 'column') classes.push(`${prefix}-flex-col`);
  if (props.direction === 'row-reverse') classes.push(`${prefix}-flex-row-reverse`);
  if (props.direction === 'column-reverse') classes.push(`${prefix}-flex-col-reverse`);
  if (props.justify) classes.push(`${prefix}-justify-${props.justify}`);
  if (props.align) classes.push(`${prefix}-align-${props.align}`);
  if (props.wrap === true) classes.push(`${prefix}-flex-wrap`);
  if (props.wrap === 'nowrap') classes.push(`${prefix}-flex-nowrap`);
  if (props.gap !== undefined) classes.push(`${prefix}-gap-${props.gap}`);

  return classes;
}

/**
 * Size token definitions for each component type
 * Maps token strings (xs, sm, md, lg, xl) to pixel values
 */
const SIZE_TOKENS = {
  icon: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 },
  spinner: { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 },
} as const;

type SizeTokenType = keyof typeof SIZE_TOKENS;

/**
 * Resolve size value to either a CSS class name or inline style
 * Supports both token strings (xs, sm, md, lg, xl) and custom px numbers
 *
 * @param size - Size value (token string or number in px)
 * @param componentType - Component type for token lookup
 * @param prefix - CSS class prefix
 * @returns Object with className and style for the component
 */
export function resolveSizeValue(
  size: string | number | undefined,
  componentType: SizeTokenType,
  prefix: string
): { className?: string; style?: string } {
  if (size === undefined) {
    return {};
  }

  // If it's a known token, use CSS class
  if (typeof size === 'string') {
    const tokens = SIZE_TOKENS[componentType];
    if (size in tokens) {
      return { className: `${prefix}-${componentType}-${size}` };
    }
    // Unknown string, try to parse as number
    const parsed = parseInt(size, 10);
    if (!isNaN(parsed)) {
      return { style: `width: ${parsed}px; height: ${parsed}px;` };
    }
    return {};
  }

  // If it's a number, use inline style
  if (typeof size === 'number') {
    return { style: `width: ${size}px; height: ${size}px;` };
  }

  return {};
}

/**
 * Render an icon using Lucide icons
 * Falls back to text placeholder if icon not found
 */
export function renderIconPlaceholder(name: string, prefix: string, size: number = 16): string {
  const iconData = getIconData(name);

  if (iconData) {
    return renderIconSvg(iconData, size, 2, `${prefix}-icon`);
  }

  // Fallback to text placeholder for unknown icons
  return `<span class="${prefix}-icon" aria-hidden="true">[${escapeHtml(name)}]</span>`;
}

// ===========================================
// Container Component Renderers
// ===========================================

export function renderCard(
  node: CardNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-card`,
    node.shadow ? `${prefix}-card-shadow-${node.shadow}` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const title = node.title
    ? `<h3 class="${prefix}-card-title">${escapeHtml(node.title)}</h3>\n`
    : '';
  const children = renderChildren(node.children);

  return `<div class="${classes}">\n${title}${children}\n</div>`;
}

export function renderModal(
  node: ModalNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-modal`,
    ...getCommonClasses(node, prefix),
  ]);

  // Build inline styles for numeric width/height
  const styles: string[] = [];
  if (typeof node.w === 'number') {
    styles.push(`width: ${node.w}px`);
  }
  if (typeof node.h === 'number') {
    styles.push(`height: ${node.h}px`);
  }
  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';

  const title = node.title
    ? `<h2 class="${prefix}-modal-title">${escapeHtml(node.title)}</h2>\n`
    : '';
  const children = renderChildren(node.children);

  return `<div class="${prefix}-modal-backdrop">
  <div class="${classes}" role="dialog" aria-modal="true"${styleAttr}${node.title ? ` aria-labelledby="modal-title"` : ''}>
${title}${children}
  </div>
</div>`;
}

export function renderDrawer(
  node: DrawerNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const position = node.position || 'left';
  const classes = buildClassString([
    `${prefix}-drawer`,
    `${prefix}-drawer-${position}`,
    ...getCommonClasses(node, prefix),
  ]);

  const title = node.title
    ? `<h2 class="${prefix}-drawer-title">${escapeHtml(node.title)}</h2>\n`
    : '';
  const children = renderChildren(node.children);

  return `<aside class="${classes}" role="complementary">\n${title}${children}\n</aside>`;
}

export function renderAccordion(
  node: AccordionNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-accordion`,
    ...getCommonClasses(node, prefix),
  ]);

  const title = node.title
    ? `<button class="${prefix}-accordion-header" aria-expanded="false">${escapeHtml(node.title)}</button>\n`
    : '';
  const children = renderChildren(node.children);

  return `<div class="${classes}">\n${title}<div class="${prefix}-accordion-content" role="region">\n${children}\n</div>\n</div>`;
}

// ===========================================
// Text Component Renderers
// ===========================================

export function renderText(node: TextNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;

  // Handle size: token (string) vs direct value (ValueWithUnit)
  const isTokenSize = typeof node.size === 'string';
  const sizeClass = isTokenSize && node.size ? `${prefix}-text-${node.size}` : undefined;
  const sizeStyle = !isTokenSize && node.size && typeof node.size === 'object' && 'value' in node.size
    ? `font-size: ${node.size.value}${node.size.unit}`
    : undefined;

  const classes = buildClassString([
    `${prefix}-text`,
    sizeClass,
    node.weight ? `${prefix}-text-${node.weight}` : undefined,
    node.align ? `${prefix}-text-${node.align}` : undefined,
    node.muted ? `${prefix}-text-muted` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const styleAttr = sizeStyle ? ` style="${sizeStyle}"` : '';

  return `<p class="${classes}"${styleAttr}>${escapeHtml(node.content)}</p>`;
}

export function renderTitle(node: TitleNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const level = Math.min(Math.max(node.level || 1, 1), 6);
  const tag = `h${level}`;

  // Handle size: token (string) vs direct value (ValueWithUnit)
  const isTokenSize = typeof node.size === 'string';
  const sizeClass = isTokenSize && node.size ? `${prefix}-text-${node.size}` : undefined;
  const sizeStyle = !isTokenSize && node.size && typeof node.size === 'object' && 'value' in node.size
    ? `font-size: ${node.size.value}${node.size.unit}`
    : undefined;

  const classes = buildClassString([
    `${prefix}-title`,
    sizeClass,
    node.align ? `${prefix}-text-${node.align}` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const styleAttr = sizeStyle ? ` style="${sizeStyle}"` : '';

  return `<${tag} class="${classes}"${styleAttr}>${escapeHtml(node.content)}</${tag}>`;
}

export function renderLink(node: LinkNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-link`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    href: node.href || '#',
  };

  if (node.external) {
    attrs.target = '_blank';
    attrs.rel = 'noopener noreferrer';
  }

  return `<a${buildAttrsString(attrs)}>${escapeHtml(node.content)}</a>`;
}

// ===========================================
// Input Component Renderers
// ===========================================

export function renderInput(node: InputNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-input`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    type: node.inputType || 'text',
    placeholder: node.placeholder,
    value: node.value,
    disabled: node.disabled,
    required: node.required,
    readonly: node.readonly,
    'aria-required': node.required ? 'true' : undefined,
  };

  const input = `<input${buildAttrsString(attrs)} />`;

  // Don't show label if it's the default "Label" and input has a placeholder
  const shouldShowLabel = node.label && !(node.label === 'Label' && node.placeholder);
  if (shouldShowLabel) {
    const labelId = `input-${Math.random().toString(36).substr(2, 9)}`;
    return `<div class="${prefix}-form-field">
  <label class="${prefix}-input-label" for="${labelId}">${escapeHtml(node.label!)}</label>
  <input${buildAttrsString({ ...attrs, id: labelId })} />
</div>`;
  }

  return input;
}

export function renderTextarea(node: TextareaNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-input`,
    `${prefix}-textarea`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    placeholder: node.placeholder,
    disabled: node.disabled,
    required: node.required,
    rows: node.rows?.toString(),
    'aria-required': node.required ? 'true' : undefined,
  };

  const textarea = `<textarea${buildAttrsString(attrs)}>${escapeHtml(node.value || '')}</textarea>`;

  if (node.label) {
    return `<div class="${prefix}-form-field">
  <label class="${prefix}-input-label">${escapeHtml(node.label)}</label>
  ${textarea}
</div>`;
  }

  return textarea;
}

export function renderSelect(node: SelectNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-input`,
    `${prefix}-select`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    disabled: node.disabled,
    required: node.required,
    'aria-required': node.required ? 'true' : undefined,
  };

  const options = node.options
    .map((opt) => {
      if (typeof opt === 'string') {
        const selected = opt === node.value ? ' selected' : '';
        return `<option value="${escapeHtml(opt)}"${selected}>${escapeHtml(opt)}</option>`;
      }
      const selected = opt.value === node.value ? ' selected' : '';
      return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
    })
    .join('\n');

  const placeholder = node.placeholder
    ? `<option value="" disabled selected>${escapeHtml(node.placeholder)}</option>\n`
    : '';

  const select = `<select${buildAttrsString(attrs)}>\n${placeholder}${options}\n</select>`;

  if (node.label) {
    return `<div class="${prefix}-form-field">
  <label class="${prefix}-input-label">${escapeHtml(node.label)}</label>
  ${select}
</div>`;
  }

  return select;
}

export function renderCheckbox(node: CheckboxNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'checkbox',
    checked: node.checked,
    disabled: node.disabled,
    'aria-checked': node.checked ? 'true' : 'false',
  };

  const checkbox = `<input${buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<label class="${prefix}-checkbox">
  ${checkbox}
  <span class="${prefix}-checkbox-label">${escapeHtml(node.label)}</span>
</label>`;
  }

  return checkbox;
}

export function renderRadio(node: RadioNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'radio',
    name: node.name,
    checked: node.checked,
    disabled: node.disabled,
    'aria-checked': node.checked ? 'true' : 'false',
  };

  const radio = `<input${buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<label class="${prefix}-radio">
  ${radio}
  <span class="${prefix}-radio-label">${escapeHtml(node.label)}</span>
</label>`;
  }

  return radio;
}

export function renderSwitch(node: SwitchNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-switch`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'checkbox',
    role: 'switch',
    checked: node.checked,
    disabled: node.disabled,
    'aria-checked': node.checked ? 'true' : 'false',
  };

  const switchEl = `<input${buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<label class="${classes}">
  ${switchEl}
  <span class="${prefix}-switch-label">${escapeHtml(node.label)}</span>
</label>`;
  }

  // Always wrap in label with .wf-switch class for proper styling
  return `<label class="${classes}">${switchEl}</label>`;
}

export function renderSlider(node: SliderNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-slider`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    type: 'range',
    min: node.min?.toString(),
    max: node.max?.toString(),
    step: node.step?.toString(),
    value: node.value?.toString(),
    disabled: node.disabled,
    'aria-valuemin': node.min?.toString(),
    'aria-valuemax': node.max?.toString(),
    'aria-valuenow': node.value?.toString(),
  };

  const slider = `<input${buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<div class="${prefix}-form-field">
  <label class="${prefix}-input-label">${escapeHtml(node.label)}</label>
  ${slider}
</div>`;
  }

  return slider;
}

// ===========================================
// Button Component Renderer
// ===========================================

export function renderButton(node: ButtonNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  // Icon-only button: has icon but no text content (or default "Button" text)
  const isIconOnly = node.icon && (!node.content.trim() || node.content === 'Button');
  const classes = buildClassString([
    `${prefix}-button`,
    node.primary ? `${prefix}-button-primary` : undefined,
    node.secondary ? `${prefix}-button-secondary` : undefined,
    node.outline ? `${prefix}-button-outline` : undefined,
    node.ghost ? `${prefix}-button-ghost` : undefined,
    node.danger ? `${prefix}-button-danger` : undefined,
    node.size ? `${prefix}-button-${node.size}` : undefined,
    node.disabled ? `${prefix}-button-disabled` : undefined,
    node.loading ? `${prefix}-button-loading` : undefined,
    isIconOnly ? `${prefix}-button-icon-only` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    type: 'button',
    disabled: node.disabled,
    'aria-disabled': node.disabled ? 'true' : undefined,
    'aria-busy': node.loading ? 'true' : undefined,
  };

  const icon = node.icon ? `${renderIconPlaceholder(node.icon, prefix)} ` : '';
  const loading = node.loading ? `<span class="${prefix}-spinner ${prefix}-spinner-sm" aria-hidden="true"></span> ` : '';
  // Don't show text for icon-only buttons
  const content = isIconOnly ? '' : escapeHtml(node.content);

  return `<button${buildAttrsString(attrs)}>${loading}${icon}${content}</button>`;
}

// ===========================================
// Display Component Renderers
// ===========================================

export function renderImage(node: ImageNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-image`,
    ...getCommonClasses(node, prefix),
  ]);

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    src: node.src || '',
    alt: node.alt || 'Image',
    loading: 'lazy',
  };

  return `<img${buildAttrsString(attrs)} />`;
}

export function renderPlaceholder(
  node: PlaceholderNode,
  context: RenderContext,
  renderChildren?: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-placeholder`,
    node.children && node.children.length > 0 ? `${prefix}-placeholder-with-children` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const label = node.label ? escapeHtml(node.label) : 'Placeholder';

  // If there are children, render them as overlay
  if (node.children && node.children.length > 0 && renderChildren) {
    const childrenHtml = renderChildren(node.children);
    return `<div class="${classes}" role="img" aria-label="${label}">
  <span class="${prefix}-placeholder-label">${label}</span>
  <div class="${prefix}-placeholder-overlay">${childrenHtml}</div>
</div>`;
  }

  return `<div class="${classes}" role="img" aria-label="${label}">${label}</div>`;
}

export function renderAvatar(node: AvatarNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;

  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'avatar', prefix);

  const classes = buildClassString([
    `${prefix}-avatar`,
    sizeResolved.className,
    ...getCommonClasses(node, prefix),
  ]);

  const styleAttr = sizeResolved.style ? ` style="${sizeResolved.style}"` : '';

  const initials = node.name
    ? node.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const ariaLabel = escapeHtml(node.name || 'Avatar');

  if (node.src) {
    return `<img class="${classes}"${styleAttr} src="${node.src}" alt="${ariaLabel}" />`;
  }

  return `<div class="${classes}"${styleAttr} role="img" aria-label="${ariaLabel}">${initials}</div>`;
}

export function renderBadge(node: BadgeNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;

  // If icon is provided, render as icon badge (circular background with icon)
  if (node.icon) {
    const iconData = getIconData(node.icon);
    const classes = buildClassString([
      `${prefix}-badge-icon`,
      node.size ? `${prefix}-badge-icon-${node.size}` : undefined,
      node.variant ? `${prefix}-badge-icon-${node.variant}` : undefined,
      ...getCommonClasses(node, prefix),
    ]);

    if (iconData) {
      const svg = renderIconSvg(iconData, 24, 2, `${prefix}-icon`);
      return `<span class="${classes}" aria-label="${escapeHtml(node.icon)}">${svg}</span>`;
    }

    // Fallback for unknown icon
    return `<span class="${classes}" aria-label="unknown icon">?</span>`;
  }

  // Default text badge (empty content = dot indicator)
  const isDot = !node.content || node.content.trim() === '';
  const classes = buildClassString([
    `${prefix}-badge`,
    isDot ? `${prefix}-badge-dot` : undefined,
    node.variant ? `${prefix}-badge-${node.variant}` : undefined,
    node.pill ? `${prefix}-badge-pill` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  return `<span class="${classes}">${escapeHtml(node.content)}</span>`;
}

export function renderIcon(node: IconNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const iconData = getIconData(node.name);

  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'icon', prefix);

  const wrapperClasses = buildClassString([
    `${prefix}-icon-wrapper`,
    node.muted ? `${prefix}-text-muted` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  if (iconData) {
    // Build icon class with optional size class
    const iconClasses = buildClassString([
      `${prefix}-icon`,
      sizeResolved.className,
    ]);
    const styleAttr = sizeResolved.style ? ` style="${sizeResolved.style}"` : '';
    const svg = renderIconSvg(iconData, 24, 2, iconClasses, styleAttr);
    return `<span class="${wrapperClasses}" aria-hidden="true">${svg}</span>`;
  }

  // Fallback for unknown icons - render a placeholder circle
  const size = sizeResolved.style?.match(/(\d+)px/)?.[1] || '24';
  const sizeNum = parseInt(size, 10);
  const placeholderSvg = `<svg class="${prefix}-icon ${sizeResolved.className || ''}" width="${sizeNum}" height="${sizeNum}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" fill="none" opacity="0.5"/>
    <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">?</text>
  </svg>`;
  return `<span class="${wrapperClasses}" aria-hidden="true" title="Unknown icon: ${escapeHtml(node.name)}">${placeholderSvg}</span>`;
}

// ===========================================
// Data Component Renderers
// ===========================================

export function renderTable(
  node: TableNode,
  context: RenderContext,
  renderNode: (node: AnyNode) => string
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-table`,
    node.striped ? `${prefix}-table-striped` : undefined,
    node.bordered ? `${prefix}-table-bordered` : undefined,
    node.hover ? `${prefix}-table-hover` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const thead = `<thead><tr>${node.columns
    .map((col) => `<th scope="col">${escapeHtml(col)}</th>`)
    .join('')}</tr></thead>`;

  const tbody = `<tbody>${node.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => {
            if (typeof cell === 'string') {
              return `<td>${escapeHtml(cell)}</td>`;
            }
            return `<td>${renderNode(cell)}</td>`;
          })
          .join('')}</tr>`
    )
    .join('')}</tbody>`;

  return `<table class="${classes}" role="table">\n${thead}\n${tbody}\n</table>`;
}

export function renderList(node: ListNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const tag = node.ordered ? 'ol' : 'ul';
  const classes = buildClassString([
    `${prefix}-list`,
    node.ordered ? `${prefix}-list-ordered` : undefined,
    node.none ? `${prefix}-list-none` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const items = node.items
    .map((item) => {
      if (typeof item === 'string') {
        return `<li class="${prefix}-list-item">${escapeHtml(item)}</li>`;
      }
      const icon = item.icon ? `${renderIconPlaceholder(item.icon, prefix)} ` : '';
      return `<li class="${prefix}-list-item">${icon}${escapeHtml(item.content)}</li>`;
    })
    .join('\n');

  return `<${tag} class="${classes}" role="list">\n${items}\n</${tag}>`;
}

// ===========================================
// Feedback Component Renderers
// ===========================================

export function renderAlert(node: AlertNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-alert`,
    node.variant ? `${prefix}-alert-${node.variant}` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const icon = node.icon ? `${renderIconPlaceholder(node.icon, prefix)} ` : '';
  const dismissBtn = node.dismissible
    ? ` <button class="${prefix}-alert-close" aria-label="Close alert">&times;</button>`
    : '';

  return `<div class="${classes}" role="alert">${icon}${escapeHtml(node.content)}${dismissBtn}</div>`;
}

export function renderToast(node: ToastNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-toast`,
    node.position ? `${prefix}-toast-${node.position}` : undefined,
    node.variant ? `${prefix}-toast-${node.variant}` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  return `<div class="${classes}" role="status" aria-live="polite">${escapeHtml(node.content)}</div>`;
}

export function renderProgress(node: ProgressNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-progress`,
    node.indeterminate ? `${prefix}-progress-indeterminate` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const value = node.value || 0;
  const max = node.max || 100;
  const percentage = Math.round((value / max) * 100);

  const label = node.label
    ? `<span class="${prefix}-progress-label">${escapeHtml(node.label)}</span>`
    : '';

  if (node.indeterminate) {
    return `<div class="${classes}" role="progressbar" aria-label="Loading">${label}</div>`;
  }

  return `<div class="${classes}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}" aria-label="Progress: ${percentage}%">
  ${label}
  <div class="${prefix}-progress-bar" style="width: ${percentage}%"></div>
</div>`;
}

export function renderSpinner(node: SpinnerNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;

  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'spinner', prefix);

  const classes = buildClassString([
    `${prefix}-spinner`,
    sizeResolved.className,
    ...getCommonClasses(node, prefix),
  ]);

  const styleAttr = sizeResolved.style ? ` style="${sizeResolved.style}"` : '';
  const label = escapeHtml(node.label || 'Loading...');
  return `<span class="${classes}"${styleAttr} role="status" aria-label="${label}"><span class="sr-only">${label}</span></span>`;
}

// ===========================================
// Overlay Component Renderers
// ===========================================

export function renderTooltip(
  node: TooltipNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-tooltip-wrapper`,
    ...getCommonClasses(node, prefix),
  ]);

  const position = node.position || 'top';
  const children = renderChildren(node.children);
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return `<div class="${classes}">
${children}
<div class="${prefix}-tooltip ${prefix}-tooltip-${position}" role="tooltip" id="${tooltipId}">${escapeHtml(node.content)}</div>
</div>`;
}

export function renderPopover(
  node: PopoverNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-popover`,
    ...getCommonClasses(node, prefix),
  ]);

  const title = node.title
    ? `<div class="${prefix}-popover-header">${escapeHtml(node.title)}</div>\n`
    : '';
  const children = renderChildren(node.children);

  return `<div class="${classes}" role="dialog">\n${title}<div class="${prefix}-popover-body">\n${children}\n</div>\n</div>`;
}

export function renderDropdown(node: DropdownNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-dropdown`,
    ...getCommonClasses(node, prefix),
  ]);

  const items = node.items
    .map((item) => {
      if ('type' in item && item.type === 'divider') {
        return `<hr class="${prefix}-divider" role="separator" />`;
      }
      // TypeScript narrowing: item is DropdownItemNode after the divider check
      const dropdownItem = item as { label: string; icon?: string; danger?: boolean; disabled?: boolean };
      const itemClasses = buildClassString([
        `${prefix}-dropdown-item`,
        dropdownItem.danger ? `${prefix}-dropdown-item-danger` : undefined,
        dropdownItem.disabled ? `${prefix}-dropdown-item-disabled` : undefined,
      ]);
      const icon = dropdownItem.icon ? `${renderIconPlaceholder(dropdownItem.icon, prefix)} ` : '';
      return `<button class="${itemClasses}" role="menuitem"${dropdownItem.disabled ? ' disabled aria-disabled="true"' : ''}>${icon}${escapeHtml(dropdownItem.label)}</button>`;
    })
    .join('\n');

  return `<div class="${classes}" role="menu">\n${items}\n</div>`;
}

// ===========================================
// Navigation Component Renderers
// ===========================================

export function renderNav(node: NavNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-nav`,
    node.vertical ? `${prefix}-nav-vertical` : undefined,
    ...getCommonClasses(node, prefix),
  ]);

  const items = node.items
    .map((item) => {
      if (typeof item === 'string') {
        return `<a class="${prefix}-nav-link" href="#" role="menuitem">${escapeHtml(item)}</a>`;
      }
      const linkClasses = buildClassString([
        `${prefix}-nav-link`,
        item.active ? `${prefix}-nav-link-active` : undefined,
        item.disabled ? `${prefix}-nav-link-disabled` : undefined,
      ]);
      const icon = item.icon ? `${renderIconPlaceholder(item.icon, prefix)} ` : '';
      const ariaCurrent = item.active ? ' aria-current="page"' : '';
      return `<a class="${linkClasses}" href="${item.href || '#'}" role="menuitem"${ariaCurrent}${item.disabled ? ' aria-disabled="true"' : ''}>${icon}${escapeHtml(item.label)}</a>`;
    })
    .join('\n');

  return `<nav class="${classes}" role="navigation">\n${items}\n</nav>`;
}

export function renderTabs(node: TabsNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-tabs`,
    ...getCommonClasses(node, prefix),
  ]);

  const tabList = node.items
    .map((label, idx) => {
      const isActive = idx === (node.active || 0);
      const tabClasses = `${prefix}-tab${isActive ? ` ${prefix}-tab-active` : ''}`;
      return `<button class="${tabClasses}" role="tab" aria-selected="${isActive}">${escapeHtml(label)}</button>`;
    })
    .join('\n');

  return `<div class="${classes}">
  <div class="${prefix}-tab-list" role="tablist">
${tabList}
  </div>
</div>`;
}

export function renderBreadcrumb(node: BreadcrumbNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  const classes = buildClassString([
    `${prefix}-breadcrumb`,
    ...getCommonClasses(node, prefix),
  ]);

  const items = node.items
    .map((item, idx) => {
      const isLast = idx === node.items.length - 1;
      if (typeof item === 'string') {
        return isLast
          ? `<span class="${prefix}-breadcrumb-item" aria-current="page">${escapeHtml(item)}</span>`
          : `<a class="${prefix}-breadcrumb-item" href="#">${escapeHtml(item)}</a>`;
      }
      return isLast
        ? `<span class="${prefix}-breadcrumb-item" aria-current="page">${escapeHtml(item.label)}</span>`
        : `<a class="${prefix}-breadcrumb-item" href="${item.href || '#'}">${escapeHtml(item.label)}</a>`;
    })
    .join(` <span class="${prefix}-breadcrumb-separator" aria-hidden="true">/</span> `);

  return `<nav class="${classes}" aria-label="Breadcrumb">${items}</nav>`;
}

// ===========================================
// Divider Component Renderer
// ===========================================

export function renderDivider(_node: DividerComponentNode, context: RenderContext): string {
  const prefix = context.options.classPrefix;
  return `<hr class="${prefix}-divider" role="separator" />`;
}
