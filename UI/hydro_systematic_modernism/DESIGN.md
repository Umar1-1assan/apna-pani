---
name: Hydro-Systematic Modernism
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#414755'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005ac4'
  primary: '#0058bf'
  on-primary: '#ffffff'
  primary-container: '#006fef'
  on-primary-container: '#fefcff'
  inverse-primary: '#aec6ff'
  secondary: '#4f6073'
  on-secondary: '#ffffff'
  secondary-container: '#d2e4fb'
  on-secondary-container: '#556679'
  tertiary: '#006577'
  on-tertiary: '#ffffff'
  tertiary-container: '#008096'
  on-tertiary-container: '#f9fdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004396'
  secondary-fixed: '#d2e4fb'
  secondary-fixed-dim: '#b7c8de'
  on-secondary-fixed: '#0b1d2d'
  on-secondary-fixed-variant: '#38485a'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  touch-target: 48px
---

## Brand & Style
The design system is anchored in the principles of **Corporate Modernism**, prioritizing clarity, precision, and utility. It is designed to bridge the gap between complex logistical data orchestration and high-stakes field operations. The aesthetic evokes a sense of "digital hydration"—using whitespace and a crisp blue-centric palette to signify cleanliness and efficiency.

The target audience includes operations managers who require high-density data visualization and delivery personnel who need immediate, glanceable information in outdoor environments. The visual language utilizes a "Card-Based" architecture to containerize information, making the interface feel modular, manageable, and trustworthy.

## Colors
The palette is dominated by **Water Blue (#0077FF)**, which serves as the primary action color, ensuring high visibility for interactive elements. **Deep Navy (#1A2B3C)** provides the grounding force, used for primary navigation and heavy typography to instill a sense of institutional reliability.

A supporting **Soft Cyan** is utilized for subtle accents, such as active states and progress indicators. The status palette is strictly functional:
- **Success (Green):** Indicates completed deliveries and healthy logistics.
- **Warning (Amber):** Signals pending items or upcoming schedule conflicts.
- **Error (Red):** Flags missed deliveries or urgent system alerts.

Surface colors utilize a range of cool grays to prevent visual fatigue during long periods of data entry.

## Typography
This design system utilizes **Inter** exclusively to ensure maximum legibility across diverse hardware. The type scale is optimized for high-density layouts, featuring a specialized "Data Tabular" role that employs monospaced numbers to ensure numerical alignment in delivery tables and financial summaries.

For mobile-first field applications, the system shifts to slightly larger touch-friendly scales and increased line-heights to accommodate usage in high-glare environments.

## Layout & Spacing
The layout employs a **Fluid Grid** system based on a 12-column architecture for desktop, transitioning to a single-column layout for mobile. 

- **Desktop:** Emphasis on high information density with 24px gutters. Dashboard modules should utilize standard grid spans (e.g., 3-column cards for metrics, 9-column cards for primary tables).
- **Mobile:** Elements must respect a minimum 48px touch target. Padding is increased in lists and forms to ensure field workers can operate the UI accurately while on the move.

Spacing follows a strict 4px base-8 increment system to maintain mathematical rhythm throughout the interface.

## Elevation & Depth
Depth is created through a combination of **Tonal Layering** and **Ambient Shadows**. This design system avoids heavy drop shadows in favor of subtle "Elevation Levels":

- **Level 0 (Base):** The main application canvas, using a soft off-white or light gray.
- **Level 1 (Cards):** Primary content containers. These use a white background with a 1px soft stroke (#E2E8F0) and a very diffused 4px blur shadow at 5% opacity.
- **Level 2 (Dropdowns/Modals):** Elements that require immediate focus. These use a 12px blur shadow at 10% opacity to clearly separate the component from the background data.

This approach keeps the interface feeling light and "airy," reflecting the brand's association with water and transparency.

## Shapes
The shape language is defined by modern, approachable geometry. While the base `roundedness` is set to 2 (8px), the specific standard for primary **Cards** and **Input Fields** in the design system is **12px**.

- **Buttons & Chips:** Use a slightly higher corner radius or pill-shape for chips to distinguish them from structural layout containers.
- **Data Containers:** Strictly follow the 12px rule to maintain a consistent card-based visual rhythm across the dashboard.

## Components
### Buttons
Primary buttons use the vibrant Water Blue with white text. Hover states should darken the blue by 10%. Secondary buttons use a ghost style (blue border, transparent background) for less critical actions.

### Cards
Cards are the primary organizational unit. They must include a consistent 24px internal padding and 12px rounded corners. Header sections within cards should be separated by a light horizontal rule.

### Status Badges
Status indicators (Delivered, Pending, Missed) are pill-shaped with a low-opacity background tint of their respective status color and a high-contrast text color of the same hue.

### Input Fields
Inputs require a 1px border (#CBD5E1) that thickens and changes to Water Blue on focus. Labels should be small, bold, and placed above the field for maximum clarity.

### Data Tables
Tables in the design system must support "Zebra Striping" (alternating row colors) for readability. Headers must be sticky to the top of the container, using the Deep Navy for text to provide a strong visual anchor.

### Mobile-Specific
For field riders, "Quick-Action" FABs (Floating Action Buttons) are recommended for common tasks like "Scan Bottle" or "Mark as Delivered," positioned in the bottom-right for easy thumb access.