# Color System Guide

## Overview

This application uses a centralized color system for consistent theming and easy maintenance.

## Color Palette

All colors are defined in `colors.ts`:

```typescript
import { colors } from '@/styles/colors'

colors.midnightBlue  // #1C2E4A - Primary brand color
colors.dustyBlue     // #52677D - Secondary elements
colors.ivory         // #BDC4D4 - Light backgrounds
colors.deepNavy      // #0F1A2B - Dark backgrounds
colors.buttercream   // #D1CFC9 - Accent backgrounds
```

## Usage

### In React Components

```tsx
import { colors } from '@/styles/colors'

// Inline styles
<div style={{ color: colors.midnightBlue }}>Text</div>

// With Ant Design components
<Button style={{ borderColor: colors.dustyBlue }}>Click</Button>
```

### In Styled Components

```tsx
import styled from 'styled-components'
import { colors } from '@/styles/colors'

const StyledButton = styled.button`
  background: ${colors.midnightBlue};
  color: white;
  border: 1px solid ${colors.dustyBlue};
  
  &:hover {
    background: ${colors.dustyBlue};
  }
`
```

### CSS Custom Properties

CSS variables are available globally:

```css
.my-element {
  color: var(--midnight-blue);
  background: var(--ivory);
  border-color: var(--dusty-blue);
}
```

### Theme-Aware Variables

For colors that change based on light/dark mode:

```css
.my-element {
  color: var(--text-strong);      /* Primary text */
  color: var(--text-base);        /* Secondary text */
  color: var(--text-muted);       /* Tertiary text */
  
  background: var(--content-bg);  /* Page background */
  background: var(--card-bg);     /* Card background */
  
  border-color: var(--card-border);
}
```

## Color Opacity

For transparent colors, use hex opacity suffixes:

```tsx
// 50% opacity
background: `${colors.midnightBlue}80`

// 25% opacity  
background: `${colors.dustyBlue}40`

// 10% opacity
background: `${colors.ivory}1A`
```

## Ant Design Theme

The Ant Design theme is automatically configured in `theme.ts` using these colors. Component-specific overrides are also defined there.

## Best Practices

1. **Always use the color system** - Avoid hardcoding hex values
2. **Use CSS variables for theme-aware colors** - They automatically adapt to light/dark mode
3. **Import from colors.ts** - For TypeScript type safety
4. **Document new colors** - If adding colors, update this guide

## Migration

If you find hardcoded colors in the codebase:

1. Replace with appropriate color from `colors.ts`
2. If no suitable color exists, consider adding it to the palette
3. Update the component to import colors

Example:
```tsx
// Before
<div style={{ color: '#1C2E4A' }}>Text</div>

// After
import { colors } from '@/styles/colors'
<div style={{ color: colors.midnightBlue }}>Text</div>
```
