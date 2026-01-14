/**
 * Input Renderers (Input, Textarea, Select, Checkbox, Radio, Switch, Slider)
 */

import type {
  InputNode,
  TextareaNode,
  SelectNode,
  CheckboxNode,
  RadioNode,
  SwitchNode,
  SliderNode,
} from '../../../ast/types';
import type { RenderContext } from './types';
import { getIconData, renderIconSvg } from '../../../icons/lucide-icons';

/**
 * Render Input node
 */
export function renderInput(node: InputNode, ctx: RenderContext): string {
  const inputClasses = ctx.buildClassString([
    `${ctx.prefix}-input`,
    node.icon ? `${ctx.prefix}-input-with-icon` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    class: inputClasses,
    type: node.inputType || 'text',
    placeholder: node.placeholder,
    value: node.value,
    disabled: node.disabled,
    required: node.required,
    readonly: node.readonly,
  };

  const inputElement = `<input${ctx.buildAttrsString(attrs)} />`;

  // Wrap with icon if specified
  if (node.icon) {
    const iconData = getIconData(node.icon);
    let iconHtml: string;
    if (iconData) {
      iconHtml = renderIconSvg(iconData, 16, 2, `${ctx.prefix}-input-icon`);
    } else {
      iconHtml = `<span class="${ctx.prefix}-input-icon">[${ctx.escapeHtml(node.icon)}]</span>`;
    }

    const wrapperClasses = ctx.buildClassString([`${ctx.prefix}-input-wrapper`]);
    const wrapper = `<div class="${wrapperClasses}"${styleAttr}>${iconHtml}${inputElement}</div>`;

    // Don't show label if it's the default "Label" and input has a placeholder
    const shouldShowLabel = node.label && !(node.label === 'Label' && node.placeholder);
    if (shouldShowLabel) {
      return `<label class="${ctx.prefix}-input-label">${ctx.escapeHtml(node.label!)}</label>\n${wrapper}`;
    }
    return wrapper;
  }

  const input = `<input${ctx.buildAttrsString(attrs)}${styleAttr} />`;

  // Don't show label if it's the default "Label" and input has a placeholder
  const shouldShowLabel2 = node.label && !(node.label === 'Label' && node.placeholder);
  if (shouldShowLabel2) {
    return `<label class="${ctx.prefix}-input-label">${ctx.escapeHtml(node.label!)}</label>\n${input}`;
  }

  return input;
}

/**
 * Render Textarea node
 */
export function renderTextarea(node: TextareaNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-input`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    placeholder: node.placeholder,
    disabled: node.disabled,
    required: node.required,
    rows: node.rows?.toString(),
  };

  const textarea = `<textarea${ctx.buildAttrsString(attrs)}${styleAttr}>${ctx.escapeHtml(node.value || '')}</textarea>`;

  if (node.label) {
    return `<label class="${ctx.prefix}-input-label">${ctx.escapeHtml(node.label)}</label>\n${textarea}`;
  }

  return textarea;
}

/**
 * Render Select node
 */
export function renderSelect(node: SelectNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-input`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    disabled: node.disabled,
    required: node.required,
  };

  const options = node.options
    .map((opt) => {
      if (typeof opt === 'string') {
        const selected = opt === node.value ? ' selected' : '';
        return `<option value="${ctx.escapeHtml(opt)}"${selected}>${ctx.escapeHtml(opt)}</option>`;
      }
      const selected = opt.value === node.value ? ' selected' : '';
      return `<option value="${ctx.escapeHtml(opt.value)}"${selected}>${ctx.escapeHtml(opt.label)}</option>`;
    })
    .join('\n');

  const placeholder = node.placeholder
    ? `<option value="" disabled selected>${ctx.escapeHtml(node.placeholder)}</option>\n`
    : '';

  const select = `<select${ctx.buildAttrsString(attrs)}${styleAttr}>\n${placeholder}${options}\n</select>`;

  if (node.label) {
    return `<label class="${ctx.prefix}-input-label">${ctx.escapeHtml(node.label)}</label>\n${select}`;
  }

  return select;
}

/**
 * Render Checkbox node
 */
export function renderCheckbox(node: CheckboxNode, ctx: RenderContext): string {
  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'checkbox',
    checked: node.checked,
    disabled: node.disabled,
  };

  const checkbox = `<input${ctx.buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<label class="${ctx.prefix}-checkbox"${styleAttr}>${checkbox}<span>${ctx.escapeHtml(node.label)}</span></label>`;
  }

  return checkbox;
}

/**
 * Render Radio node
 */
export function renderRadio(node: RadioNode, ctx: RenderContext): string {
  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'radio',
    name: node.name,
    checked: node.checked,
    disabled: node.disabled,
  };

  const radio = `<input${ctx.buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<label class="${ctx.prefix}-radio"${styleAttr}>${radio}<span>${ctx.escapeHtml(node.label)}</span></label>`;
  }

  return radio;
}

/**
 * Render Switch node
 */
export function renderSwitch(node: SwitchNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-switch`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'checkbox',
    role: 'switch',
    checked: node.checked,
    disabled: node.disabled,
  };

  const switchEl = `<input${ctx.buildAttrsString(attrs)} />`;

  if (node.label) {
    return `<label class="${classes}"${styleAttr}>${switchEl} ${ctx.escapeHtml(node.label)}</label>`;
  }

  // Always wrap in label with .wf-switch class for proper styling
  return `<label class="${classes}"${styleAttr}>${switchEl}</label>`;
}

/**
 * Render Slider node
 */
export function renderSlider(node: SliderNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-slider`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    type: 'range',
    min: node.min?.toString(),
    max: node.max?.toString(),
    step: node.step?.toString(),
    value: node.value?.toString(),
    disabled: node.disabled,
  };

  const slider = `<input${ctx.buildAttrsString(attrs)}${styleAttr} />`;

  if (node.label) {
    return `<label class="${ctx.prefix}-input-label">${ctx.escapeHtml(node.label)}</label>\n${slider}`;
  }

  return slider;
}
