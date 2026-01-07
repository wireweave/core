/**
 * Device viewport presets for wireweave
 *
 * Standard device dimensions for wireframe design
 */

export interface ViewportSize {
  width: number;
  height: number;
  label: string;
  category: 'desktop' | 'tablet' | 'mobile';
}

/**
 * Device preset definitions
 */
export const DEVICE_PRESETS: Record<string, ViewportSize> = {
  // Desktop
  'desktop-sm': { width: 1280, height: 800, label: 'Small Laptop', category: 'desktop' },
  'desktop': { width: 1440, height: 900, label: 'Desktop', category: 'desktop' },
  'desktop-lg': { width: 1920, height: 1080, label: 'Full HD', category: 'desktop' },
  'desktop-xl': { width: 2560, height: 1440, label: 'QHD', category: 'desktop' },

  // Tablet
  'ipad': { width: 1024, height: 768, label: 'iPad (Landscape)', category: 'tablet' },
  'ipad-portrait': { width: 768, height: 1024, label: 'iPad (Portrait)', category: 'tablet' },
  'ipad-pro': { width: 1366, height: 1024, label: 'iPad Pro 12.9"', category: 'tablet' },
  'ipad-pro-portrait': { width: 1024, height: 1366, label: 'iPad Pro 12.9" (Portrait)', category: 'tablet' },

  // Mobile
  'iphone-se': { width: 375, height: 667, label: 'iPhone SE', category: 'mobile' },
  'iphone14': { width: 390, height: 844, label: 'iPhone 14', category: 'mobile' },
  'iphone14-pro': { width: 393, height: 852, label: 'iPhone 14 Pro', category: 'mobile' },
  'iphone14-pro-max': { width: 430, height: 932, label: 'iPhone 14 Pro Max', category: 'mobile' },
  'android': { width: 360, height: 800, label: 'Android', category: 'mobile' },
  'android-lg': { width: 412, height: 915, label: 'Android Large', category: 'mobile' },
};

/**
 * Default viewport size (desktop)
 */
export const DEFAULT_VIEWPORT: ViewportSize = DEVICE_PRESETS['desktop'];

/**
 * Parse viewport value (e.g., "1440x900", "1440", or number)
 */
export function parseViewportString(value: string | number): { width: number; height?: number } | null {
  // If it's already a number, treat as width only
  if (typeof value === 'number') {
    return { width: value };
  }

  // Format: "1440x900" or "1440"
  const match = value.match(/^(\d+)(?:x(\d+))?$/);
  if (!match) return null;

  const width = parseInt(match[1], 10);
  const height = match[2] ? parseInt(match[2], 10) : undefined;

  return { width, height };
}

/**
 * Get viewport size from device preset or explicit size
 */
export function resolveViewport(
  viewport?: string | number,
  device?: string
): ViewportSize {
  // Device preset takes precedence
  if (device && DEVICE_PRESETS[device]) {
    return DEVICE_PRESETS[device];
  }

  // Parse explicit viewport
  if (viewport !== undefined) {
    const parsed = parseViewportString(viewport);
    if (parsed) {
      return {
        width: parsed.width,
        height: parsed.height || DEFAULT_VIEWPORT.height,
        label: `${parsed.width}x${parsed.height || DEFAULT_VIEWPORT.height}`,
        category: parsed.width <= 430 ? 'mobile' : parsed.width <= 1024 ? 'tablet' : 'desktop',
      };
    }
  }

  // Default
  return DEFAULT_VIEWPORT;
}

/**
 * Get all available device presets
 */
export function getDevicePresets(): Record<string, ViewportSize> {
  return { ...DEVICE_PRESETS };
}

/**
 * Check if a device preset exists
 */
export function isValidDevicePreset(device: string): boolean {
  return device in DEVICE_PRESETS;
}

/**
 * Calculate scale factor to fit viewport in container
 *
 * @param viewport - The viewport dimensions
 * @param containerWidth - Available container width
 * @param containerHeight - Available container height (optional)
 * @param maxScale - Maximum scale factor (default: 1)
 * @returns Scale factor (0-1 range, or up to maxScale)
 */
export function calculateViewportScale(
  viewport: ViewportSize,
  containerWidth: number,
  containerHeight?: number,
  maxScale: number = 1
): number {
  const scaleX = containerWidth / viewport.width;
  const scaleY = containerHeight ? containerHeight / viewport.height : Infinity;

  // Use the smaller scale to fit both dimensions
  const scale = Math.min(scaleX, scaleY, maxScale);

  // Round to 3 decimal places
  return Math.round(scale * 1000) / 1000;
}

/**
 * Options for creating preview wrapper HTML
 */
export interface PreviewWrapperOptions {
  /** CSS class prefix (default: 'wf') */
  prefix?: string;
  /** Dark mode background */
  darkMode?: boolean;
  /** Container width for auto-scaling */
  containerWidth?: number;
  /** Container height for auto-scaling */
  containerHeight?: number;
  /** Custom scale (overrides auto-calculated scale) */
  scale?: number;
}

/**
 * Wrap rendered HTML in a preview container with scaling
 *
 * @param html - The rendered wireframe HTML
 * @param viewport - The viewport size used for rendering
 * @param options - Preview wrapper options
 * @returns HTML string with preview wrapper
 */
export function wrapInPreviewContainer(
  html: string,
  viewport: ViewportSize,
  options: PreviewWrapperOptions = {}
): string {
  const {
    prefix = 'wf',
    darkMode = false,
    containerWidth,
    containerHeight,
    scale: customScale,
  } = options;

  // Calculate scale if container dimensions provided
  const scale =
    customScale ??
    (containerWidth ? calculateViewportScale(viewport, containerWidth, containerHeight) : 1);

  const previewClass = `${prefix}-viewport-preview${darkMode ? ' dark' : ''}`;
  const wrapperStyle = `transform: scale(${scale}); width: ${viewport.width}px; height: ${viewport.height}px;`;

  return `<div class="${previewClass}" style="width: 100%; min-height: ${Math.round(viewport.height * scale)}px;">
  <div class="${prefix}-viewport-wrapper" style="${wrapperStyle}">
${html}
  </div>
</div>`;
}
