---
name: Al-Makhbaz Al-Lubnani
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d4'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ed'
  surface-container: '#f5ece7'
  surface-container-high: '#efe6e2'
  surface-container-highest: '#e9e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#55423e'
  inverse-surface: '#34302c'
  inverse-on-surface: '#f8efea'
  outline: '#89726d'
  outline-variant: '#dcc1bb'
  surface-tint: '#9c432f'
  primary: '#812f1d'
  on-primary: '#ffffff'
  primary-container: '#a04632'
  on-primary-container: '#ffd4cb'
  inverse-primary: '#ffb4a4'
  secondary: '#5c6236'
  on-secondary: '#ffffff'
  secondary-container: '#dee4ac'
  on-secondary-container: '#606639'
  tertiary: '#4f4a36'
  on-tertiary: '#ffffff'
  tertiary-container: '#68624d'
  on-tertiary-container: '#e6dec3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a4'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#7d2c1a'
  secondary-fixed: '#e1e7af'
  secondary-fixed-dim: '#c5cb95'
  on-secondary-fixed: '#191e00'
  on-secondary-fixed-variant: '#444a20'
  tertiary-fixed: '#ebe2c8'
  tertiary-fixed-dim: '#cec6ad'
  on-tertiary-fixed: '#1f1c0b'
  on-tertiary-fixed-variant: '#4c4733'
  background: '#fff8f5'
  on-background: '#1e1b18'
  surface-variant: '#e9e1dc'
typography:
  display-lg:
    fontFamily: Aref Ruqaa
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Aref Ruqaa
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Newsreader
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 80px
---

## Brand & Style

The design system is rooted in the "Modern Heritage" movement, blending traditional Levantine craftsmanship with a clean, editorial structure. The personality is artisanal, warm, and nostalgic, designed to evoke the aroma of a stone oven and the tactile nature of hand-rolled dough. The target audience values authenticity, slow food, and cultural storytelling.

To achieve a vintage yet premium feel, the system utilizes a **Tactile / Minimalist** hybrid style. It avoids the coldness of modern tech by using subtle organic textures, generous whitespace, and a focus on calligraphic hierarchy. In this Light Mode iteration, the visual journey reflects a sun-drenched morning in a Levantine courtyard, using "Aref Ruqaa" as the anchor for cultural identity against a bright, airy backdrop.

## Colors

The palette is inspired by the sun-baked landscapes of the Levant, optimized for a high-clarity light environment that feels warm and organic.
- **Primary (Terracotta):** Used for key actions and brand markers, representing the heat of the oven and sun-dried clay.
- **Secondary (Deep Olive):** Used for accents, botanical elements, and secondary buttons, grounding the brand in Mediterranean agriculture.
- **Tertiary (Cream):** Serves as a soft, flour-dusted highlight for containers and background sections.
- **Neutral (Charcoal):** The primary text and outline color, providing a sophisticated, ink-like contrast against the light surfaces.

## Typography

Typography is the primary vessel for the brand's heritage. 
- **Headings:** "Aref Ruqaa" is used for all Arabic and primary English display text to maintain a calligraphic, artisanal feel. 
- **Body:** "Tajawal" provides a literary, classic serif quality that feels like a vintage cookbook or a heritage journal.
- **Labels:** "Noto Sans Arabic" is used sparingly for functional UI elements (like price tags or form labels) to ensure modern clarity and grounding. 

All headings should favor a "center-aligned" layout for hero sections to emphasize the calligraphic beauty. Weights are optimized to remain legible and sharp against the light background.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for desktop to maintain an editorial, book-like structure. On mobile, it transitions to a fluid 4-column layout. 

Spacing is intentionally generous (the "breath of the dough"). Sections are separated by large vertical gaps to prevent the UI from feeling cluttered. Content should be contained within a maximum width of 1200px to ensure the serif typography remains legible and elegant. Use asymmetrical layouts (e.g., text on left, floating image on right) to mimic the feel of a high-end culinary magazine.

## Elevation & Depth

This design system avoids heavy shadows and synthetic glows. Instead, it uses **Tonal Layering** and **Physical Metaphors**:
- **Surface Tiers:** Use subtle shifts between the off-white background and light Tertiary Cream surfaces to define containers and cards.
- **Atmospheric Depth:** Elements should feel like they are resting on a sun-drenched stone or wooden surface. Use extremely soft, low-opacity charcoal-tints (3% opacity) only for elevated cards to suggest weight.
- **Linework:** Use thin, 1px solid or dashed borders in Olive or Terracotta to separate content, reminiscent of vintage postage or etched stamps.

## Shapes

The shape language is "Soft-Organic." We avoid perfect circles or sharp geometric corners. 
- **Containers:** Use `soft` (4px) roundedness to mimic the hand-cut edges of pastry.
- **Buttons:** Should have a slight irregularity where possible in illustration, but in the UI, they remain consistently soft-cornered.
- **Imagery:** Use organic mask shapes (arches or soft-edged rectangles) for photography to reflect Levantine architectural motifs, framed by generous whitespace.

## Components

- **Buttons:** Primary buttons are filled Terracotta with Cream "Aref Ruqaa" text. Secondary buttons use an Olive 1px border. 
- **Cards:** Cards use a light Tertiary Cream background with a 1px Olive or Neutral border. They should include generous internal padding (32px) to allow the typography to breathe.
- **Inputs:** Text fields are underline-only or have a very subtle warm-gray fill, maintaining the editorial aesthetic.
- **Chips/Badges:** Used for dietary labels (e.g., "Vegan", "Sourdough"). These use the Deep Olive color with Cream text, styled like heritage stamps.
- **Dividers:** Use custom SVG dividers that resemble hand-drawn flourishes or wheat stalks to separate long-form content.
- **Navigation:** A minimal top bar with a centered logo. On scroll, it should take on a semi-transparent light backdrop with a subtle blur to maintain an airy feel.