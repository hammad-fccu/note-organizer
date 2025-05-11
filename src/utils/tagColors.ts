/**
 * Utility for managing tag colors in the application
 */

// Available tag color gradients
const TAG_COLORS = [
  'blue',
  'green',
  'purple',
  'pink',
  'yellow',
  'red',
  'indigo',
  'teal',
  'orange',
  'cyan'
];

// Cache to ensure same tags get same colors
const tagColorCache: Record<string, string> = {};

/**
 * Get a consistent color for a tag
 * @param tag The tag text
 * @returns CSS class name for the tag color
 */
export function getTagColor(tag: string): string {
  // If we've already assigned a color to this tag, use it
  if (tagColorCache[tag]) {
    return tagColorCache[tag];
  }
  
  // Get a random color from the available colors
  const randomIndex = Math.floor(Math.random() * TAG_COLORS.length);
  const colorName = TAG_COLORS[randomIndex];
  
  // Cache the color assignment for this tag
  tagColorCache[tag] = colorName;
  
  return colorName;
}

/**
 * Get the CSS variable name for a tag color
 * @param colorName The name of the color
 * @returns CSS variable name
 */
export function getTagColorVariable(colorName: string): string {
  return `var(--tag-${colorName})`;
}

/**
 * Returns an inline style object for a tag with a random gradient background
 * @param tag The tag text
 * @returns Style object with background gradient
 */
export function getTagStyle(tag: string): React.CSSProperties {
  const colorName = getTagColor(tag);
  return {
    background: `var(--tag-${colorName})`
  };
} 