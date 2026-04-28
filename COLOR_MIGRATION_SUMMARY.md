
### Primary Blues
```css
--blue-50: #e8f4fc;
--blue-100: #b9dcf7;
--blue-200: #97cbf3;
--blue-300: #67b3ee;
--blue-400: #49a5ea;
--blue-500: #1c8ee5;
--blue-600: #1981d0;
--blue-700: #1465a3;
--blue-800: #0f4e7e;
--blue-900: #0c3c60;
```

### Info Blues (Lighter variant)
```css
--info-50: #e6f5fc;
--info-100: #b1e0f7;
--info-200: #8bd1f3;
--info-300: #56bcee;
--info-400: #35afea;
--info-500: #039be5;
--info-600: #038dd0;
--info-700: #026ea3;
--info-800: #02557e;
--info-900: #014160;
```

### Grays (Neutrals)
```css
--gray-50: #fcfcfc;
--gray-100: #f5f5f5;
--gray-200: #f1f1f1;
--gray-300: #eaeaea;
--gray-400: #e6e6e6;
--gray-500: #e0e0e0;
--gray-600: #cccccc;
--gray-700: #b2b2b2;
--gray-800: #8a8a8a;
--gray-900: #696969;
```

### Text Colors
```css
--text-primary: #212121;
--text-secondary: #6a6a6a;
--text-disabled: #999999;
--text-inverse: #ffffff;
```

### Semantic Colors
```css
--success: #4caf50;        /* Green - Positive trends, completed status */
--success-light: #c8e6c9;
--error: #e53935;           /* Red - Negative trends, cancelled status */
--error-light: #f7c2c0;
--warning: #f9a825;         /* Amber/Yellow - Pending, warnings */
--warning-light: #fde4bb;
--info: #039be5;            /* Light blue - Information */
--info-light: #b1e0f7;
```

### Backgrounds
```css
--bg-page: #f8fafc;
--bg-card: #ffffff;
--bg-elevated: #f5f5f5;
```

### Borders & Shadows
```css
--border-light: #e0e0e0;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
```

---

## 📦 **Quick Install Version (CSS Format)**

```css
/* Copy this entire block into your global CSS file */

:root {
  /* Blues */
  --blue-50: #e8f4fc;
  --blue-100: #b9dcf7;
  --blue-200: #97cbf3;
  --blue-300: #67b3ee;
  --blue-400: #49a5ea;
  --blue-500: #1c8ee5;
  --blue-600: #1981d0;
  --blue-700: #1465a3;
  --blue-800: #0f4e7e;
  --blue-900: #0c3c60;
  
  /* Info */
  --info-50: #e6f5fc;
  --info-100: #b1e0f7;
  --info-200: #8bd1f3;
  --info-300: #56bcee;
  --info-400: #35afea;
  --info-500: #039be5;
  --info-600: #038dd0;
  --info-700: #026ea3;
  --info-800: #02557e;
  --info-900: #014160;
  
  /* Grays */
  --gray-50: #fcfcfc;
  --gray-100: #f5f5f5;
  --gray-200: #f1f1f1;
  --gray-300: #eaeaea;
  --gray-400: #e6e6e6;
  --gray-500: #e0e0e0;
  --gray-600: #cccccc;
  --gray-700: #b2b2b2;
  --gray-800: #8a8a8a;
  --gray-900: #696969;
  
  /* Text */
  --text-primary: #212121;
  --text-secondary: #6a6a6a;
  --text-disabled: #999999;
  --text-inverse: #ffffff;
  
  /* Semantic */
  --success: #4caf50;
  --success-light: #c8e6c9;
  --error: #e53935;
  --error-light: #f7c2c0;
  --warning: #f9a825;
  --warning-light: #fde4bb;
  
  /* Backgrounds */
  --bg-page: #f8fafc;
  --bg-card: #ffffff;
  --bg-elevated: #f5f5f5;
  
  /* Borders */
  --border-light: #e0e0e0;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

---

## 🎯 **Tailwind Config (If Using Tailwind)**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#e8f4fc',
          100: '#b9dcf7',
          200: '#97cbf3',
          300: '#67b3ee',
          400: '#49a5ea',
          500: '#1c8ee5',
          600: '#1981d0',
          700: '#1465a3',
          800: '#0f4e7e',
          900: '#0c3c60',
        },
        info: {
          50: '#e6f5fc',
          100: '#b1e0f7',
          200: '#8bd1f3',
          300: '#56bcee',
          400: '#35afea',
          500: '#039be5',
          600: '#038dd0',
          700: '#026ea3',
          800: '#02557e',
          900: '#014160',
        },
        gray: {
          50: '#fcfcfc',
          100: '#f5f5f5',
          200: '#f1f1f1',
          300: '#eaeaea',
          400: '#e6e6e6',
          500: '#e0e0e0',
          600: '#cccccc',
          700: '#b2b2b2',
          800: '#8a8a8a',
          900: '#696969',
        },
        success: '#4caf50',
        error: '#e53935',
        warning: '#f9a825',
      },
    },
  },
};
```

---

## 📱 **SCSS Variables**

```scss
// variables.scss
$blue-50: #e8f4fc;
$blue-100: #b9dcf7;
$blue-200: #97cbf3;
$blue-300: #67b3ee;
$blue-400: #49a5ea;
$blue-500: #1c8ee5;
$blue-600: #1981d0;
$blue-700: #1465a3;
$blue-800: #0f4e7e;
$blue-900: #0c3c60;

$gray-50: #fcfcfc;
$gray-100: #f5f5f5;
$gray-200: #f1f1f1;
$gray-300: #eaeaea;
$gray-400: #e6e6e6;
$gray-500: #e0e0e0;
$gray-600: #cccccc;
$gray-700: #b2b2b2;
$gray-800: #8a8a8a;
$gray-900: #696969;

$text-primary: #212121;
$text-secondary: #6a6a6a;
$success: #4caf50;
$error: #e53935;
$warning: #f9a825;
$bg-page: #f8fafc;
$bg-card: #ffffff;
```

---

## 🎨 **Color Usage Guide**

| Color | Use For |
|-------|---------|
| `--blue-500` | Primary buttons, active states, links |
| `--blue-50` | Background highlights, selected items |
| `--gray-100` | Card backgrounds, table headers |
| `--gray-300` | Dividers, subtle borders |
| `--text-primary` | Headings, main body text |
| `--text-secondary` | Labels, subtitles, helper text |
| `--success` | Positive amounts, completed status |
| `--error` | Negative amounts, cancelled/deleted |
| `--warning` | Pending status, alerts |
| `--bg-page` | Main page background |
| `--bg-card` | Card and container backgrounds |

