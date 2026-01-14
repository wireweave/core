/**
 * Semantic Marker Rendering Utilities
 *
 * Semantic markers use the syntax [component:variant] to indicate
 * what a visual element represents. This helps LLMs understand
 * the meaning of placeholder content.
 *
 * Supported markers:
 * - [avatar] or [avatar:size] - User avatar (renders as circle placeholder)
 * - [badge:variant] TEXT - Status badge (TEXT is displayed inside the badge)
 * - [dot:variant] - Status dot (renders as small circle before text)
 * - [icon:name] - Icon placeholder
 *
 * Examples:
 * - "[avatar] John Doe" → renders avatar circle + "John Doe"
 * - "[badge:primary] PRO" → renders badge containing "PRO"
 * - "[dot:success] Active" → renders green dot + "Active"
 */

/**
 * Render a single semantic marker to HTML (without content)
 */
export function renderSemanticMarker(
  component: string,
  variant: string | undefined,
  prefix: string
): string {
  switch (component) {
    case 'avatar':
      // Render as small circle placeholder
      const avatarSize = variant || 'sm';
      return `<span class="${prefix}-semantic-avatar ${prefix}-semantic-avatar-${avatarSize}" data-semantic="avatar" data-variant="${avatarSize}" aria-hidden="true"></span>`;

    case 'dot':
      // Render as status dot
      const dotVariant = variant || 'default';
      return `<span class="${prefix}-semantic-dot ${prefix}-semantic-dot-${dotVariant}" data-semantic="dot" data-variant="${dotVariant}" aria-hidden="true"></span>`;

    case 'icon':
      // Render as icon placeholder
      const iconName = variant || 'default';
      return `<span class="${prefix}-semantic-icon" data-semantic="icon" data-variant="${iconName}" aria-hidden="true">[${iconName}]</span>`;

    default:
      // Unknown marker - render as data attribute only
      return `<span class="${prefix}-semantic-unknown" data-semantic="${component}" data-variant="${variant || ''}">[${component}${variant ? ':' + variant : ''}]</span>`;
  }
}

/**
 * Render a semantic marker with text content (for badge)
 */
export function renderSemanticMarkerWithContent(
  component: string,
  variant: string | undefined,
  content: string,
  prefix: string,
  escapeHtml: (text: string) => string
): string {
  switch (component) {
    case 'badge':
      // Render as inline badge with content inside
      const badgeVariant = variant || 'default';
      const escapedContent = escapeHtml(content);
      return `<span class="${prefix}-semantic-badge ${prefix}-semantic-badge-${badgeVariant}" data-semantic="badge" data-variant="${badgeVariant}">${escapedContent}</span>`;

    default:
      // Fallback: render marker then content
      return renderSemanticMarker(component, variant, prefix) + escapeHtml(content);
  }
}

/**
 * Parse and render semantic markers in text content
 */
export function renderSemanticMarkers(
  text: string,
  prefix: string,
  escapeHtml: (text: string) => string
): string {
  // Pattern: [component] or [component:variant] with optional following text for badge
  const markerPattern = /\[([a-z]+)(?::([a-z0-9-]+))?\](\s*)/gi;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerPattern.exec(text)) !== null) {
    // Add text before the marker
    if (match.index > lastIndex) {
      result += escapeHtml(text.substring(lastIndex, match.index));
    }

    const [fullMatch, component, variant] = match;
    const comp = component.toLowerCase();
    const varnt = variant?.toLowerCase();

    // For badge, consume the following word as the badge content
    if (comp === 'badge') {
      const afterMarker = text.substring(match.index + fullMatch.length);
      // Match until newline, next marker, or end
      const contentMatch = afterMarker.match(/^([^\n\[]+?)(?=\n|\[|$)/);
      const badgeContent = contentMatch ? contentMatch[1].trim() : '';

      result += renderSemanticMarkerWithContent(comp, varnt, badgeContent, prefix, escapeHtml);
      lastIndex = match.index + fullMatch.length + (contentMatch ? contentMatch[0].length : 0);
      markerPattern.lastIndex = lastIndex; // Update regex position
    } else {
      result += renderSemanticMarker(comp, varnt, prefix);
      lastIndex = match.index + fullMatch.length;
    }
  }

  // Add remaining text after last marker
  if (lastIndex < text.length) {
    result += escapeHtml(text.substring(lastIndex));
  }

  // If no markers found, just escape and return
  if (lastIndex === 0) {
    return escapeHtml(text);
  }

  return result;
}

/**
 * Process table cell content with semantic markers and newlines
 *
 * Special handling for avatar + text layout:
 * When content starts with [avatar], wraps in flex container
 * so avatar and text align horizontally, with text stacking vertically
 */
export function renderTableCellContent(
  content: string,
  prefix: string,
  escapeHtml: (text: string) => string
): string {
  // Check if content starts with [avatar] marker
  const avatarMatch = content.match(/^\[avatar(?::([a-z0-9-]+))?\]\s*/i);

  if (avatarMatch) {
    // Avatar + text layout: flex container with avatar and text block
    const avatarVariant = avatarMatch[1]?.toLowerCase();
    const avatarHtml = renderSemanticMarker('avatar', avatarVariant, prefix);
    const restContent = content.slice(avatarMatch[0].length);

    // Process remaining content for other markers
    const restHtml = renderSemanticMarkers(restContent, prefix, escapeHtml);
    // Convert newlines to flex items for vertical stacking
    const lines = restHtml.split('\n');
    const textHtml =
      lines.length > 1
        ? lines.map((line) => `<span>${line}</span>`).join('')
        : restHtml;

    return `<div class="${prefix}-cell-avatar-layout">${avatarHtml}<div class="${prefix}-cell-avatar-text">${textHtml}</div></div>`;
  }

  // Normal rendering: semantic markers then newlines to <br>
  const withMarkers = renderSemanticMarkers(content, prefix, escapeHtml);
  return withMarkers.replace(/\n/g, '<br>');
}
