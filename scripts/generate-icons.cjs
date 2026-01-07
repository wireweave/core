/**
 * Generate icon data from lucide package
 *
 * This script extracts SVG element data from lucide icons
 * and generates a TypeScript file with all icons.
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../node_modules/lucide/dist/esm/icons');
const outputFile = path.join(__dirname, '../src/icons/lucide-icons.ts');

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all icon files
const iconFiles = fs.readdirSync(iconsDir)
  .filter(f => f.endsWith('.js') && !f.endsWith('.map'));

console.log(`Found ${iconFiles.length} icons`);

// Extract icon data from each file
const icons = {};
let errorCount = 0;

for (const file of iconFiles) {
  const iconName = file.replace('.js', '');
  const filePath = path.join(iconsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract the icon array using regex
  // Match: const IconName = [...];
  const match = content.match(/const \w+ = (\[[\s\S]*?\]);/);

  if (match) {
    try {
      // Convert to valid JSON by replacing single quotes and handling the format
      let arrayStr = match[1];

      // The format is: [["element", { attr: "value" }], ...]
      // We need to evaluate it safely
      const iconData = eval(arrayStr);
      icons[iconName] = iconData;
    } catch (e) {
      console.error(`Error parsing ${iconName}:`, e.message);
      errorCount++;
    }
  } else {
    console.error(`Could not extract icon data from ${file}`);
    errorCount++;
  }
}

console.log(`Successfully extracted ${Object.keys(icons).length} icons`);
if (errorCount > 0) {
  console.log(`Errors: ${errorCount}`);
}

// Generate TypeScript file
const tsContent = `/**
 * Lucide Icons Data
 *
 * Auto-generated from lucide package.
 * Do not edit manually.
 *
 * Total icons: ${Object.keys(icons).length}
 *
 * @license ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023
 * as part of Feather (MIT). All other copyright (c) for Lucide are held
 * by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * @see https://lucide.dev
 */

export type IconElement = [string, Record<string, string>];
export type IconData = IconElement[];

export const lucideIcons: Record<string, IconData> = ${JSON.stringify(icons, null, 2)};

/**
 * Get icon data by name
 */
export function getIconData(name: string): IconData | undefined {
  // Try exact match first
  if (lucideIcons[name]) {
    return lucideIcons[name];
  }

  // Try converting camelCase to kebab-case
  const kebabName = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  if (lucideIcons[kebabName]) {
    return lucideIcons[kebabName];
  }

  // Try converting kebab-case to exact icon name format
  return undefined;
}

/**
 * Render icon data to SVG string
 */
export function renderIconSvg(
  data: IconData,
  size: number = 24,
  strokeWidth: number = 2,
  className: string = ''
): string {
  const elements = data.map(([tag, attrs]) => {
    const attrStr = Object.entries(attrs)
      .map(([key, value]) => \`\${key}="\${value}"\`)
      .join(' ');
    return \`<\${tag} \${attrStr} />\`;
  }).join('');

  return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="\${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="\${className}">\${elements}</svg>\`;
}
`;

fs.writeFileSync(outputFile, tsContent);
console.log(`Generated ${outputFile}`);

// Calculate file size
const stats = fs.statSync(outputFile);
console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
