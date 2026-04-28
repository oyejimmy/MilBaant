# Mobile Responsive Design Guide

## Overview

This guide documents the mobile-first responsive design system implemented for the MilBaant application. The system ensures a native-like mobile experience while maintaining desktop functionality.

## Key Components Created

### 1. **useResponsive Hook** (`src/hooks/useResponsive.ts`)

Custom hook for responsive breakpoints and device detection.

```tsx
import { useResponsive, useButtonSize, useMobileLayout } from '@/hooks/useResponsive'

function MyComponent() {
  const { isMobile, isTablet, isDesktop, isTouch, width, height } = useResponsive()
  const buttonSize = useButtonSize() // 'large' on mobile, 'middle' on desktop
  const isMobileLayout = useMobileLayout() // true if width < 768px
  
  return (
    <Button size={buttonSize}>
      {isMobile ? <PlusOutlined /> : 'Add Expense'}
    </Button>
  )
}
```

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px
- Touch: Mobile or Tablet (for touch-friendly UI)

### 2. **MobileBottomNav** (`src/components/MobileBottomNav.tsx`)

Bottom navigation bar for mobile devices (replaces sidebar).

**Features:**
- 5 primary navigation items
- Touch-friendly 44x44px minimum tap targets
- Active state indicators
- Safe area inset support for notched phones
- "More" button to open full navigation drawer

**Usage:**
```tsx
import { MobileBottomNav } from '@/components/MobileBottomNav'

<MobileBottomNav onMoreClick={() => setDrawerOpen(true)} />
```

### 3. **ResponsiveCard** (`src/components/ResponsiveCard.tsx`)

Converts table rows to mobile-friendly cards.

**Features:**
- Desktop: Regular Ant Design card
- Mobile: Stacked label-value pairs with touch feedback
- Automatic layout switching based on screen size

**Usage:**
```tsx
import { ResponsiveCard, ResponsiveCardList } from '@/components/ResponsiveCard'

<ResponsiveCardList>
  <ResponsiveCard
    fields={[
      { label: 'Name', value: 'John Doe', strong: true },
      { label: 'Amount', value: formatCurrency(1500) },
      { label: 'Date', value: formatDate(date) },
    ]}
    actions={
      <Space>
        <Button icon={<EditOutlined />} size="small">Edit</Button>
        <Button icon={<DeleteOutlined />} size="small" danger>Delete</Button>
      </Space>
    }
  />
</ResponsiveCardList>
```

### 4. **BottomSheet** (`src/components/BottomSheet.tsx`)

Mobile-friendly modal alternative that slides up from bottom.

**Features:**
- Mobile: Bottom sheet (slides from bottom)
- Desktop: Right-side drawer
- Automatic height adjustment
- Safe area inset support

**Usage:**
```tsx
import { BottomSheet } from '@/components/BottomSheet'

<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Expense"
  height="80vh"
>
  <ExpenseForm />
</BottomSheet>
```

### 5. **IconButton** (`src/components/IconButton.tsx`)

Touch-friendly icon button with automatic sizing.

**Features:**
- Minimum 44x44px on mobile
- Tooltip on desktop only
- Automatic size adjustment
- Accessibility support

**Usage:**
```tsx
import { IconButton } from '@/components/IconButton'

<IconButton
  icon={<EditOutlined />}
  tooltip="Edit expense"
  onClick={handleEdit}
  type="primary"
/>
```

## Design Principles

### 1. Touch Targets

All interactive elements have a minimum size of 44x44px on mobile:

```css
--touch-target-min: 44px;
```

**Implementation:**
- Buttons automatically sized with `useButtonSize()` hook
- Minimum spacing of 8px between clickable elements
- IconButton component enforces minimum sizes

### 2. Typography Scale

Mobile-first typography with responsive scaling:

```css
/* Mobile (default) */
--font-size-h1: 24px;
--font-size-h2: 20px;
--font-size-h3: 18px;
--font-size-base: 14px;

/* Desktop (768px+) */
--font-size-h1: 32px;
--font-size-h2: 24px;
--font-size-h3: 20px;
--font-size-base: 16px;
```

### 3. Layout Patterns

#### Mobile Layout
- Single column stacked layout
- Bottom navigation (56px height)
- Compact header (52px height)
- Cards instead of tables
- Bottom sheets instead of modals

#### Desktop Layout
- Multi-column grid layouts
- Left sidebar navigation (220px expanded, 60px collapsed)
- Full header (56px height)
- Tables with full data
- Right-side drawers and centered modals

### 4. Safe Area Insets

Support for notched phones (iPhone X+):

```css
@supports (padding: max(0px)) {
  padding-bottom: max(env(safe-area-inset-bottom), 4px);
}
```

## Migration Guide

### Converting Existing Pages to Mobile-Responsive

#### Step 1: Add Responsive Hook

```tsx
import { useResponsive } from '@/hooks/useResponsive'

export function MyPage() {
  const { isMobile, isTouch } = useResponsive()
  
  // ... rest of component
}
```

#### Step 2: Replace Tables with Conditional Rendering

**Before:**
```tsx
<Table columns={columns} dataSource={data} />
```

**After:**
```tsx
{isMobile ? (
  <ResponsiveCardList>
    {data.map(item => (
      <ResponsiveCard
        key={item.id}
        fields={[
          { label: 'Name', value: item.name },
          { label: 'Amount', value: formatCurrency(item.amount) },
        ]}
        actions={<Button>Edit</Button>}
      />
    ))}
  </ResponsiveCardList>
) : (
  <Table columns={columns} dataSource={data} />
)}
```

#### Step 3: Replace Modals with BottomSheet

**Before:**
```tsx
<Modal open={isOpen} onClose={onClose} title="Add Item">
  <Form />
</Modal>
```

**After:**
```tsx
<BottomSheet open={isOpen} onClose={onClose} title="Add Item">
  <Form />
</BottomSheet>
```

#### Step 4: Update Button Sizes

**Before:**
```tsx
<Button icon={<PlusOutlined />}>Add Expense</Button>
```

**After:**
```tsx
const buttonSize = useButtonSize()

<Button size={buttonSize} icon={<PlusOutlined />}>
  {isMobile ? null : 'Add Expense'}
</Button>

// Or use IconButton for icon-only buttons
<IconButton
  icon={<PlusOutlined />}
  tooltip="Add Expense"
  onClick={handleAdd}
/>
```

#### Step 5: Adjust Form Layouts

**Before:**
```tsx
<Form layout="horizontal" labelCol={{ span: 6 }}>
```

**After:**
```tsx
<Form layout={isMobile ? 'vertical' : 'horizontal'} 
      labelCol={isMobile ? undefined : { span: 6 }}>
```

## AppLayout Updates

The `AppLayout` component already includes mobile responsiveness:

### Mobile Features
- Bottom navigation bar (5 main items + More button)
- Collapsible drawer for full navigation
- Compact header (52px)
- Content padding adjusted for bottom nav (56px)

### Desktop Features
- Collapsible sidebar (220px / 60px)
- Full header with breadcrumbs
- Profile dropdown
- Theme toggle

## CSS Variables Reference

### Spacing
```css
--touch-target-min: 44px;
--spacing-unit: 8px;
```

### Border Radius
```css
--border-radius-sm: 8px;
--border-radius-md: 10px;
--border-radius-lg: 14px;
```

### Typography
```css
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 14px;  /* 16px on desktop */
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-h3: 18px;    /* 20px on desktop */
--font-size-h2: 20px;    /* 24px on desktop */
--font-size-h1: 24px;    /* 32px on desktop */
```

### Safe Area Insets
```css
--safe-area-inset-top: env(safe-area-inset-top, 0px);
--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-inset-left: env(safe-area-inset-left, 0px);
--safe-area-inset-right: env(safe-area-inset-right, 0px);
```

## Testing Checklist

### Mobile Devices to Test
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone 14 Pro Max (430px width)
- [ ] Samsung Galaxy S21 (360px width)
- [ ] Google Pixel 6 (412px width)

### Features to Test
- [ ] Bottom navigation works on all pages
- [ ] All buttons are at least 44x44px
- [ ] No horizontal scroll on any page
- [ ] Forms are usable in portrait mode
- [ ] Modals/drawers slide from bottom
- [ ] Tables convert to cards on mobile
- [ ] Text is readable (minimum 14px)
- [ ] Touch targets have 8px spacing
- [ ] Safe area insets work on notched phones
- [ ] Pull-to-refresh is disabled
- [ ] Tap highlights are removed

### Performance
- [ ] No layout shift on resize
- [ ] Smooth transitions between breakpoints
- [ ] Debounced resize handlers
- [ ] Optimized re-renders

## Best Practices

### 1. Mobile-First Development
Always design for mobile first, then enhance for desktop:

```tsx
// ✅ Good: Mobile-first
<div style={{
  padding: '12px',
  fontSize: '14px',
  '@media (min-width: 768px)': {
    padding: '20px',
    fontSize: '16px',
  }
}}>

// ❌ Bad: Desktop-first
<div style={{
  padding: '20px',
  fontSize: '16px',
  '@media (max-width: 767px)': {
    padding: '12px',
    fontSize: '14px',
  }
}}>
```

### 2. Use Semantic HTML
```tsx
// ✅ Good
<nav role="navigation" aria-label="Main navigation">
  <button aria-label="Home" aria-current="page">

// ❌ Bad
<div onClick={navigate}>
  <span>Home</span>
```

### 3. Avoid Fixed Widths
```tsx
// ✅ Good
<Input style={{ width: '100%' }} />

// ❌ Bad
<Input style={{ width: '300px' }} />
```

### 4. Test on Real Devices
- Use Chrome DevTools device emulation
- Test on actual phones when possible
- Check touch interactions, not just layout
- Verify safe area insets on notched devices

### 5. Progressive Enhancement
```tsx
// ✅ Good: Works without JS
<a href="/expenses">Expenses</a>

// ❌ Bad: Requires JS
<div onClick={() => navigate('/expenses')}>Expenses</div>
```

## Common Patterns

### Responsive Grid
```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={6}>
    <StatCard />
  </Col>
</Row>
```

### Conditional Rendering
```tsx
const { isMobile } = useResponsive()

return (
  <>
    {isMobile ? (
      <MobileView />
    ) : (
      <DesktopView />
    )}
  </>
)
```

### Responsive Spacing
```tsx
<Space 
  direction={isMobile ? 'vertical' : 'horizontal'}
  size={isMobile ? 12 : 16}
>
```

### Floating Action Button (FAB)
```tsx
import { FloatButton } from 'antd'

<FloatButton
  icon={<PlusOutlined />}
  type="primary"
  tooltip="Add Expense"
  style={{
    bottom: 72, // Above bottom nav
    right: 16,
  }}
  onClick={handleAdd}
/>
```

## Troubleshooting

### Issue: Horizontal scroll on mobile
**Solution:** Check for fixed widths, use `width: 100%` or `max-width: 100%`

### Issue: Buttons too small to tap
**Solution:** Use `useButtonSize()` hook or `IconButton` component

### Issue: Modal covers entire screen
**Solution:** Replace with `BottomSheet` component

### Issue: Text too small to read
**Solution:** Use CSS variables for font sizes, minimum 14px on mobile

### Issue: Layout shifts on resize
**Solution:** Use debounced resize handlers, avoid inline calculations

## Future Enhancements

- [ ] Swipeable cards for delete/edit actions
- [ ] Pull-to-refresh on list pages
- [ ] Gesture navigation (swipe back)
- [ ] Offline support with service workers
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Dark mode improvements for OLED screens
- [ ] Haptic feedback on interactions

## Resources

- [Web.dev Mobile Best Practices](https://web.dev/mobile/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design Mobile](https://material.io/design/platform-guidance/android-mobile.html)
- [Ant Design Mobile](https://mobile.ant.design/)
- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
