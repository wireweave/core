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
} from '../../../ast/types'
import type { RenderContext } from './types'
import { getIconData, renderIconSvg, renderUnknownIconSvg } from '../../../icons/lucide-icons'

/**
 * Pair a label with its control inside a field wrapper.
 *
 * A label and its control are one unit. Emitted as siblings they become two
 * independent flex items of whatever row contains them, so the label drifts
 * beside the control instead of sitting above it. The wrapper makes the pair a
 * single flex item that stacks internally.
 */
function renderField(label: string, control: string, ctx: RenderContext): string {
  return `<div class="${ctx.prefix}-field"><label class="${ctx.prefix}-input-label">${ctx.escapeHtml(label)}</label>\n${control}</div>`
}

/**
 * Render Input node
 */
export function renderInput(node: InputNode, ctx: RenderContext): string {
  const inputClasses = ctx.buildClassString([
    `${ctx.prefix}-input`,
    node.icon ? `${ctx.prefix}-input-with-icon` : undefined,
    ...ctx.getCommonClasses(node),
  ])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    class: inputClasses,
    type: node.inputType || 'text',
    placeholder: node.placeholder,
    value: node.value,
    disabled: node.disabled,
    required: node.required,
    readonly: node.readonly,
  }

  const inputElement = `<input${ctx.buildAttrsString(attrs)} />`

  // Wrap with icon if specified
  if (node.icon) {
    const iconData = getIconData(node.icon)
    let iconHtml: string
    if (iconData) {
      // `wf-icon` is the SIZING contract — `renderIconSvg` drops its size
      // argument and emits no width/height, so the glyph is sized only by the
      // class it is given. `wf-input-icon` carries placement, not size; alone it
      // leaves a viewBox-only SVG to fill its flex parent.
      iconHtml = renderIconSvg(iconData, 16, 2, `${ctx.prefix}-icon ${ctx.prefix}-input-icon`)
    } else {
      // Unknown icon: render the shared placeholder (never leak the raw name)
      iconHtml = `<span class="${ctx.prefix}-input-icon" title="Unknown icon: ${ctx.escapeHtml(node.icon)}">${renderUnknownIconSvg(`${ctx.prefix}-input-icon`, 16)}</span>`
    }

    const wrapperClasses = ctx.buildClassString([`${ctx.prefix}-input-wrapper`])
    const wrapper = `<div class="${wrapperClasses}"${styleAttr}>${iconHtml}${inputElement}</div>`

    // Don't show label if it's the default "Label" and input has a placeholder
    const shouldShowLabel = node.label && !(node.label === 'Label' && node.placeholder)
    if (shouldShowLabel) {
      return renderField(node.label!, wrapper, ctx)
    }
    return wrapper
  }

  const input = `<input${ctx.buildAttrsString(attrs)}${styleAttr} />`

  // Don't show label if it's the default "Label" and input has a placeholder
  const shouldShowLabel2 = node.label && !(node.label === 'Label' && node.placeholder)
  if (shouldShowLabel2) {
    return renderField(node.label!, input, ctx)
  }

  return input
}

/**
 * Render Textarea node
 */
export function renderTextarea(node: TextareaNode, ctx: RenderContext): string {
  // Same element contract as select: `wf-textarea` owns min-height/resize,
  // which `.wf-textarea` in the stylesheet defines and nothing else can carry.
  const classes = ctx.buildClassString([`${ctx.prefix}-textarea`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    placeholder: node.placeholder,
    disabled: node.disabled,
    required: node.required,
    rows: node.rows?.toString(),
  }

  const textarea = `<textarea${ctx.buildAttrsString(attrs)}${styleAttr}>${ctx.escapeHtml(node.value || '')}</textarea>`

  if (node.label) {
    return renderField(node.label, textarea, ctx)
  }

  return textarea
}

/**
 * Render Select node
 */
export function renderSelect(node: SelectNode, ctx: RenderContext): string {
  // `wf-select` is the element contract — the base field look is shared with
  // `wf-input` via a grouped selector in the stylesheet, while `wf-select`
  // carries what only a <select> needs (chevron, intrinsic width in a row).
  const classes = ctx.buildClassString([`${ctx.prefix}-select`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    disabled: node.disabled,
    required: node.required,
  }

  const hasSelectedValue =
    node.value &&
    node.options.some((opt) => (typeof opt === 'string' ? opt : opt.value) === node.value)

  const options = node.options
    .map((opt) => {
      if (typeof opt === 'string') {
        const selected = opt === node.value ? ' selected="selected"' : ''
        return `<option value="${ctx.escapeHtml(opt)}"${selected}>${ctx.escapeHtml(opt)}</option>`
      }
      const selected = opt.value === node.value ? ' selected="selected"' : ''
      return `<option value="${ctx.escapeHtml(opt.value)}"${selected}>${ctx.escapeHtml(opt.label)}</option>`
    })
    .join('\n')

  const placeholderSelected = hasSelectedValue ? '' : ' selected="selected"'
  const placeholder = node.placeholder
    ? `<option value="" disabled="disabled"${placeholderSelected}>${ctx.escapeHtml(node.placeholder)}</option>\n`
    : ''

  const select = `<select${ctx.buildAttrsString(attrs)}${styleAttr}>\n${placeholder}${options}\n</select>`

  if (node.label) {
    return renderField(node.label, select, ctx)
  }

  return select
}

/**
 * Render Checkbox node
 */
export function renderCheckbox(node: CheckboxNode, ctx: RenderContext): string {
  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'checkbox',
    checked: node.checked,
    disabled: node.disabled,
  }

  const checkbox = `<input${ctx.buildAttrsString(attrs)} />`

  if (node.label) {
    return `<label class="${ctx.prefix}-checkbox"${styleAttr}>${checkbox}<span>${ctx.escapeHtml(node.label)}</span></label>`
  }

  return checkbox
}

/**
 * Render Radio node
 */
export function renderRadio(node: RadioNode, ctx: RenderContext): string {
  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'radio',
    name: node.name,
    checked: node.checked,
    disabled: node.disabled,
  }

  const radio = `<input${ctx.buildAttrsString(attrs)} />`

  if (node.label) {
    return `<label class="${ctx.prefix}-radio"${styleAttr}>${radio}<span>${ctx.escapeHtml(node.label)}</span></label>`
  }

  return radio
}

/**
 * Render Switch node
 */
export function renderSwitch(node: SwitchNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-switch`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    type: 'checkbox',
    role: 'switch',
    checked: node.checked,
    disabled: node.disabled,
  }

  const switchEl = `<input${ctx.buildAttrsString(attrs)} />`

  if (node.label) {
    return `<label class="${classes}"${styleAttr}>${switchEl} ${ctx.escapeHtml(node.label)}</label>`
  }

  // Always wrap in label with .wf-switch class for proper styling
  return `<label class="${classes}"${styleAttr}>${switchEl}</label>`
}

/**
 * Render Slider node
 */
export function renderSlider(node: SliderNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-slider`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    type: 'range',
    min: node.min?.toString(),
    max: node.max?.toString(),
    step: node.step?.toString(),
    value: node.value?.toString(),
    disabled: node.disabled,
  }

  const slider = `<input${ctx.buildAttrsString(attrs)}${styleAttr} />`

  if (node.label) {
    return renderField(node.label, slider, ctx)
  }

  return slider
}
