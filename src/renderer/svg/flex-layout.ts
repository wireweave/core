/**
 * CSS Flexbox Layout Algorithm Implementation
 *
 * Implements the CSS Flexbox specification for SVG rendering.
 * This enables pixel-perfect layout matching with HTML/CSS output.
 *
 * Reference: https://www.w3.org/TR/css-flexbox-1/
 */

// ===========================================
// Types
// ===========================================

/**
 * Flex item properties (maps to CSS flex properties)
 */
export interface FlexItemProps {
  /** flex-basis: The initial main size before free space distribution */
  basis: number | 'auto' | 'content';
  /** flex-grow: Factor for distributing positive free space (default: 0) */
  grow: number;
  /** flex-shrink: Factor for absorbing negative free space (default: 1) */
  shrink: number;
  /** min-width/min-height constraint */
  minSize: number;
  /** max-width/max-height constraint */
  maxSize: number;
  /** The measured content size (used when basis is 'auto' or 'content') */
  contentSize: number;
  /** Alignment override for this item (align-self) */
  alignSelf?: FlexAlign;
}

/**
 * Computed flex item with final layout values
 */
export interface FlexItemComputed {
  /** Index in the original array */
  index: number;
  /** Original flex properties */
  props: FlexItemProps;
  /** The resolved flex basis (in pixels) */
  flexBasis: number;
  /** The final computed size on the main axis */
  mainSize: number;
  /** The final computed size on the cross axis */
  crossSize: number;
  /** Position on main axis */
  mainPosition: number;
  /** Position on cross axis */
  crossPosition: number;
  /** Whether this item was frozen during flex resolution */
  frozen: boolean;
  /** Scaled flex shrink factor */
  scaledShrinkFactor: number;
}

/**
 * justify-content values
 */
export type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

/**
 * align-items / align-self values
 */
export type FlexAlign =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

/**
 * Flex container configuration
 */
export interface FlexContainerConfig {
  /** Main axis size (width for row, height for column) */
  mainSize: number;
  /** Cross axis size (height for row, width for column) */
  crossSize?: number;
  /** flex-direction: row or column */
  direction: 'row' | 'column';
  /** justify-content */
  justifyContent: JustifyContent;
  /** align-items */
  alignItems: FlexAlign;
  /** Gap between items */
  gap: number;
}

/**
 * Flex layout result
 */
export interface FlexLayoutResult {
  /** Computed items with positions and sizes */
  items: FlexItemComputed[];
  /** Total main axis size used */
  mainSizeUsed: number;
  /** Maximum cross axis size */
  crossSizeMax: number;
}

// ===========================================
// Flexbox Algorithm Implementation
// ===========================================

/**
 * Performs CSS Flexbox layout calculation
 *
 * Implementation follows the CSS Flexbox specification:
 * 1. Determine flex base sizes
 * 2. Collect flex items into flex lines (single line for now)
 * 3. Resolve flexible lengths
 * 4. Distribute remaining space (justify-content)
 * 5. Cross-axis alignment (align-items)
 */
export function computeFlexLayout(
  items: FlexItemProps[],
  config: FlexContainerConfig
): FlexLayoutResult {
  const { mainSize, crossSize, justifyContent, alignItems, gap } = config;

  // Step 1: Initialize computed items with flex basis
  const computed: FlexItemComputed[] = items.map((props, index) => {
    // Resolve flex-basis
    let flexBasis: number;
    if (props.basis === 'auto' || props.basis === 'content') {
      flexBasis = props.contentSize;
    } else {
      flexBasis = props.basis;
    }

    // Clamp to min/max
    flexBasis = clamp(flexBasis, props.minSize, props.maxSize);

    return {
      index,
      props,
      flexBasis,
      mainSize: flexBasis,
      crossSize: 0,
      mainPosition: 0,
      crossPosition: 0,
      frozen: false,
      scaledShrinkFactor: props.shrink * flexBasis,
    };
  });

  // Step 2: Calculate total gap
  const totalGap = Math.max(0, (items.length - 1) * gap);

  // Step 3: Calculate free space
  const totalFlexBasis = computed.reduce((sum, item) => sum + item.flexBasis, 0);
  let freeSpace = mainSize - totalFlexBasis - totalGap;

  // Step 4: Resolve flexible lengths
  if (freeSpace !== 0) {
    resolveFlexibleLengths(computed, freeSpace);
  }

  // Step 5: Calculate positions based on justify-content
  distributeMainAxis(computed, mainSize, totalGap, gap, justifyContent);

  // Step 6: Handle cross-axis alignment
  const crossSizeMax = crossSize ?? Math.max(...computed.map(item => item.props.contentSize), 0);
  alignCrossAxis(computed, crossSizeMax, alignItems);

  // Calculate actual main size used
  const mainSizeUsed = computed.reduce((sum, item) => sum + item.mainSize, 0) + totalGap;

  return {
    items: computed,
    mainSizeUsed,
    crossSizeMax,
  };
}

/**
 * Resolve flexible lengths (flex-grow and flex-shrink)
 *
 * This implements the core flex algorithm:
 * - If free space > 0: distribute using flex-grow
 * - If free space < 0: absorb using flex-shrink
 */
function resolveFlexibleLengths(items: FlexItemComputed[], initialFreeSpace: number): void {
  // Reset all items to unfrozen
  items.forEach(item => {
    item.frozen = false;
    item.mainSize = item.flexBasis;
  });

  let freeSpace = initialFreeSpace;
  const isGrowing = freeSpace > 0;

  // Iteratively resolve flex until all items are frozen
  let iteration = 0;
  const maxIterations = items.length + 1; // Prevent infinite loops

  while (iteration < maxIterations) {
    iteration++;

    // Find unfrozen items
    const unfrozen = items.filter(item => !item.frozen);
    if (unfrozen.length === 0) break;

    // Calculate flex factor sum
    let flexFactorSum: number;
    if (isGrowing) {
      flexFactorSum = unfrozen.reduce((sum, item) => sum + item.props.grow, 0);
    } else {
      flexFactorSum = unfrozen.reduce((sum, item) => sum + item.scaledShrinkFactor, 0);
    }

    // If no flex factors, freeze all remaining items
    if (flexFactorSum === 0) {
      unfrozen.forEach(item => item.frozen = true);
      break;
    }

    // Calculate remaining free space
    const usedSpace = items.reduce((sum, item) => sum + item.mainSize, 0);
    const containerMainSize = usedSpace + freeSpace;
    freeSpace = containerMainSize - usedSpace;

    // Distribute free space
    let totalViolation = 0;

    for (const item of unfrozen) {
      let flexFraction: number;

      if (isGrowing) {
        // Distribute positive free space by flex-grow
        flexFraction = item.props.grow / flexFactorSum;
      } else {
        // Absorb negative free space by scaled flex-shrink
        flexFraction = item.scaledShrinkFactor / flexFactorSum;
      }

      const deltaSize = freeSpace * flexFraction;
      const targetSize = item.flexBasis + deltaSize;

      // Apply min/max constraints and calculate violation
      const clampedSize = clamp(targetSize, item.props.minSize, item.props.maxSize);
      const violation = clampedSize - targetSize;

      item.mainSize = clampedSize;
      totalViolation += violation;

      // If this item hit a constraint, freeze it
      if (violation !== 0) {
        item.frozen = true;
      }
    }

    // If no violations, we're done
    if (Math.abs(totalViolation) < 0.01) {
      unfrozen.forEach(item => item.frozen = true);
      break;
    }

    // Update free space for next iteration
    freeSpace = containerMainSize - items.reduce((sum, item) => sum + item.mainSize, 0);
  }
}

/**
 * Distribute items along the main axis based on justify-content
 */
function distributeMainAxis(
  items: FlexItemComputed[],
  containerSize: number,
  totalGap: number,
  gap: number,
  justifyContent: JustifyContent
): void {
  if (items.length === 0) return;

  const totalItemSize = items.reduce((sum, item) => sum + item.mainSize, 0);
  const freeSpace = containerSize - totalItemSize - totalGap;

  let position = 0;
  let itemGap = gap;
  let leadingSpace = 0;

  switch (justifyContent) {
    case 'flex-start':
      // Items packed at start
      leadingSpace = 0;
      break;

    case 'flex-end':
      // Items packed at end
      leadingSpace = freeSpace;
      break;

    case 'center':
      // Items centered
      leadingSpace = freeSpace / 2;
      break;

    case 'space-between':
      // First item at start, last at end, space between
      leadingSpace = 0;
      if (items.length > 1) {
        itemGap = gap + freeSpace / (items.length - 1);
      }
      break;

    case 'space-around':
      // Equal space around each item
      if (items.length > 0) {
        const spacePerItem = freeSpace / items.length;
        leadingSpace = spacePerItem / 2;
        itemGap = gap + spacePerItem;
      }
      break;

    case 'space-evenly':
      // Equal space between all items and edges
      if (items.length > 0) {
        const totalSpaces = items.length + 1;
        const spaceSize = freeSpace / totalSpaces;
        leadingSpace = spaceSize;
        itemGap = gap + spaceSize;
      }
      break;
  }

  // Apply positions
  position = leadingSpace;
  for (let i = 0; i < items.length; i++) {
    items[i].mainPosition = position;
    position += items[i].mainSize;
    if (i < items.length - 1) {
      position += itemGap;
    }
  }
}

/**
 * Align items on the cross axis based on align-items
 */
function alignCrossAxis(
  items: FlexItemComputed[],
  containerCrossSize: number,
  alignItems: FlexAlign
): void {
  for (const item of items) {
    // Use align-self if specified, otherwise use container's align-items
    const align = item.props.alignSelf ?? alignItems;

    // For now, use content size as cross size
    // In a full implementation, this would consider the actual measured cross size
    const itemCrossSize = item.props.contentSize;
    item.crossSize = align === 'stretch' ? containerCrossSize : itemCrossSize;

    switch (align) {
      case 'flex-start':
        item.crossPosition = 0;
        break;

      case 'flex-end':
        item.crossPosition = containerCrossSize - item.crossSize;
        break;

      case 'center':
        item.crossPosition = (containerCrossSize - item.crossSize) / 2;
        break;

      case 'stretch':
        item.crossPosition = 0;
        item.crossSize = containerCrossSize;
        break;

      case 'baseline':
        // Simplified baseline alignment (treat as flex-start)
        item.crossPosition = 0;
        break;
    }
  }
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert wireframe justify value to CSS justify-content
 */
export function toJustifyContent(justify?: string): JustifyContent {
  switch (justify) {
    case 'start': return 'flex-start';
    case 'end': return 'flex-end';
    case 'center': return 'center';
    case 'between': return 'space-between';
    case 'around': return 'space-around';
    case 'evenly': return 'space-evenly';
    default: return 'flex-start';
  }
}

/**
 * Convert wireframe align value to CSS align-items
 */
export function toAlignItems(align?: string): FlexAlign {
  switch (align) {
    case 'start': return 'flex-start';
    case 'end': return 'flex-end';
    case 'center': return 'center';
    case 'stretch': return 'stretch';
    case 'baseline': return 'baseline';
    default: return 'stretch';
  }
}

/**
 * Create default flex item props
 */
export function createFlexItemProps(
  contentSize: number,
  options: Partial<FlexItemProps> = {}
): FlexItemProps {
  return {
    basis: options.basis ?? 'auto',
    grow: options.grow ?? 0,
    shrink: options.shrink ?? 1,
    minSize: options.minSize ?? 0,
    maxSize: options.maxSize ?? Infinity,
    contentSize,
    alignSelf: options.alignSelf,
  };
}

/**
 * Create flex item props for a flex child (flex: 1)
 */
export function createFlexGrowItemProps(
  contentSize: number,
  options: Partial<FlexItemProps> = {}
): FlexItemProps {
  return {
    basis: options.basis ?? 0,
    grow: options.grow ?? 1,
    shrink: options.shrink ?? 1,
    minSize: options.minSize ?? 0,
    maxSize: options.maxSize ?? Infinity,
    contentSize,
    alignSelf: options.alignSelf,
  };
}
