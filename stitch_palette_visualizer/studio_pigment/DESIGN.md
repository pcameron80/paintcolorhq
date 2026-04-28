# Design System Strategy: The Architectural Palette

## 1. Overview & Creative North Star

**Creative North Star: The Curated Atelier**
This design system moves away from the "database" feel of traditional directories and toward the atmosphere of a high-end architectural studio. We are not just listing colors; we are showcasing light, texture, and intent. The system rejects the rigid, "boxed-in" layout of standard web apps in favor of **Intentional Asymmetry** and **Tonal Depth**.

To break the template look, we use extreme whitespace (scale 16 and 20) and overlapping elements. Imagine a physical mood board where paint swatches sit atop architectural vellum. Components should feel like "precision tools"—slight, sharp, and purposeful—allowing the paint colors themselves to remain the hero of every view.

---

## 2. Colors & Surface Philosophy

The palette is anchored by deep architectural blues (`primary` #004ac6 and `secondary` #1c6584) and grounded by a sophisticated stone neutral (`tertiary` #58554d). 

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. We define space through **Tonal Transitions**. A sidebar is not "separated" by a line; it is distinguished by sitting on `surface_container_low` while the main canvas rests on `surface`. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create a "nested" depth:
*   **Base Layer:** `surface` (#fbf8ff)
*   **Secondary Content Areas:** `surface_container_low` (#f4f2ff)
*   **Interactive Cards:** `surface_container_lowest` (#ffffff) to create a subtle "pop" against the background.
*   **Utility Overlays:** `surface_container_high` (#e6e6ff)

### The Glass & Gradient Rule
To prevent a flat, digital feel, floating elements (like navigation bars or color detail modals) must utilize **Glassmorphism**. Apply `surface` colors at 80% opacity with a `backdrop-blur` of 12px. For primary CTAs, use a subtle linear gradient from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle to mimic the sheen of fresh silk-finish paint.

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance architectural precision with modern readability.

*   **Display & Headlines (Manrope):** This geometric sans-serif acts as our structural beam. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero sections to create an editorial, high-fashion impact.
*   **Body & UI (Inter):** Chosen for its clinical clarity. `body-md` (0.875rem) is the workhorse for color descriptions and metadata.
*   **Hierarchy as Identity:** By pairing a massive `display-sm` title with a significantly smaller `label-md` uppercase tag, we create a "Scale Contrast" that feels premium and intentional rather than "default."

---

## 4. Elevation & Depth

In this system, depth is felt, not seen. We avoid heavy dropshadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. This creates a soft, natural lift that mimics the way a physical paint chip sits on a table.
*   **Ambient Shadows:** For floating elements like "Save to Palette" menus, use a shadow with a 32px blur, 0% spread, and 6% opacity using the `on_surface` (#161935) color. This mimics natural ambient occlusion rather than a harsh artificial light.
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility (e.g., in a high-density filter list), use `outline_variant` at **15% opacity**. It should be a suggestion of a boundary, not a hard stop.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `roundness-md` (0.375rem). No border. White text.
*   **Secondary:** `surface_container_highest` fill with `primary` text. This feels like a "tool" integrated into the surface.
*   **Tertiary/Ghost:** No fill. `primary` text with an underline that only appears on hover.

### Input Fields
*   **Text Inputs:** No bottom line or full border. Use a `surface_container_low` fill with a `roundness-sm`. On focus, transition the background to `surface_container_lowest` and apply a 1px "Ghost Border" of `primary` at 20% opacity.

### Cards & Color Swatches
*   **The Swatch Card:** Forbid the use of dividers. Use `spacing-6` (2rem) of vertical whitespace between the color name and its hex value. Swatches should have a `roundness-lg` (0.5rem) to feel like tactile objects.
*   **The "Paint Drip" Interaction:** On hover, a card should shift from `surface_container_lowest` to `surface_bright` with a very subtle `primary_fixed` ambient glow.

### Bespoke Component: The "Comparison Vellum"
A specialized UI pattern for this system where two colors can be dragged over one another. Use a semi-transparent `surface_variant` overlay with a `backdrop-blur` to show how a color might look under different lighting conditions.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. If the left margin is `spacing-8`, try a right margin of `spacing-12` for editorial layouts.
*   **Do** use `tertiary_fixed` (#e8e2d7) as a background for "Inspiration" sections to evoke the feeling of raw canvas or architectural paper.
*   **Do** ensure all color swatches are large enough to dominate the UI; the interface should feel like it's wrapping around the paint.

### Don’t:
*   **Don’t** use black (#000000) for text. Always use `on_surface` (#161935) to maintain the sophisticated, architectural blue undertone.
*   **Don’t** use standard dividers (`<hr>`). Use a `surface_container_high` block with a height of 4px and a width of 48px to separate sections—it feels more like a structural mark.
*   **Don’t** crowd the components. If a screen feels "busy," increase the spacing token by two levels (e.g., move from `spacing-4` to `spacing-6`).