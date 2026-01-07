/**
 * Viewport module for wireweave
 *
 * Handles viewport sizing, device presets, and scaling
 */

export type { ViewportSize, PreviewWrapperOptions } from './presets';
export {
  DEVICE_PRESETS,
  DEFAULT_VIEWPORT,
  parseViewportString,
  resolveViewport,
  getDevicePresets,
  isValidDevicePreset,
  calculateViewportScale,
  wrapInPreviewContainer,
} from './presets';
