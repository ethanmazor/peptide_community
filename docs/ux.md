# UI/UX spec

---

## Visual direction

Clean and clinical. The app should feel closer to a medical tracking tool than a fitness app. Data is the decoration — no gradients, no decorative shadows, no illustration. White surfaces, 0.5px borders, generous whitespace.

**Aesthetic principles:**
- Flat surfaces only — no gradients, no box shadows (except functional focus rings)
- Minimal color — teal accent for interactive/active states only, everything else is neutral
- Typography does the heavy lifting — font weight and size hierarchy, not color, communicates importance
- Dense but not cramped — show meaningful data without overwhelming the screen

---

## Color

**Primary accent:** `#1D9E75` (teal)

Used for: active tab indicator, "Due now" dose card border, dose pill badges, cycle progress bar fill, FAB background, primary CTA buttons, chart bars, teal metric accents.

Used nowhere else. Do not use teal as a background, header color, or decorative element.

**Semantic colors (via CSS custom properties):**
- Success states: `var(--color-background-success)` / `var(--color-text-success)`
- Warning (vial low): `var(--color-background-warning)` / `var(--color-text-warning)`
- Destructive actions: `var(--color-background-danger)` / `var(--color-text-danger)`

**All other colors via CSS custom properties** — never hardcode hex values for surfaces, text, or borders. This ensures dark mode works automatically.

---

## Typography

| Use | Size | Weight |
|---|---|---|
| Page title | 20px | 500 |
| Section header | 13px | 500, uppercase, letter-spacing 0.04em |
| Card title / item name | 14–15px | 500 |
| Body / form fields | 14px | 400 |
| Secondary / meta text | 12px | 400 |
| Micro labels | 10px | 500, uppercase |

Font: system font stack (San Francisco on iOS/macOS, Segoe UI on Windows, Roboto on Android/Linux).

---

## Color scheme

Implement system default — respects the user's OS preference. Use Tailwind's `dark:` variant or CSS custom properties for all color values. Never hardcode light-mode colors without a dark-mode equivalent.

---

## Layout

- **Mobile-first** — design and build at 375px width
- **Max content width** — 480px, centered on desktop with `var(--color-background-tertiary)` behind it
- **Safe areas** — respect iOS safe area insets using `env(safe-area-inset-*)` for the tab bar and any bottom sheets
- **No nested scroll containers** — page content scrolls once; no overflow:scroll inside overflow:scroll

---

## Navigation

Bottom tab bar, always visible (except when a bottom sheet is fully open).

Five tabs in order: Home, History, Calc, Photos, Settings.

Tab bar specs:
- Height: 52px + bottom safe area inset
- Background: `var(--color-background-primary)` with a 0.5px top border
- Active tab: teal icon fill + teal label
- Inactive tab: muted icon + muted label
- Icons: use Lucide React icons (20px, stroke-based)

Suggested Lucide icons: `Home`, `ClipboardList`, `Calculator`, `Camera`, `Settings`.

---

## Component patterns

### Dose card (Home screen)

Three visual states:

**Due now:**
```
border: 1px solid #1D9E75
background: var(--color-background-primary)
```
Contains: peptide name (14px/500), dose + units + time (12px/400 secondary), "Due now" pill badge (teal bg, teal text).

**Logged:**
```
border: 0.5px solid var(--color-border-tertiary)
background: var(--color-background-primary)
```
Contains: peptide name, dose + units + logged time, "Logged" pill badge (secondary bg, muted text).

**Upcoming:**
Same as Logged but pill shows the scheduled time (e.g. "8:00 PM").

Pill badge specs: `border-radius: 20px`, `font-size: 10px`, `padding: 2px 8px`, `font-weight: 500`.

### Cycle progress bar

```
height: 5px
background: var(--color-background-tertiary)   /* track */
fill: #1D9E75                                   /* progress */
border-radius: 3px
```

Label row above: protocol name left-aligned (12px secondary), "Day X / Y" right-aligned (12px teal).

### Log dose bottom sheet

Use `vaul` Drawer component. Snap points: `['95%']` — nearly full height on mobile.

Sheet handle: 32px wide, 3px tall, centered, `var(--color-border-secondary)`.

Field layout:
- Each field group has a micro label (10px/500 uppercase) above the input
- Inputs are full-width with `var(--color-background-secondary)` fill, 0.5px border, `border-radius: 8px`
- Two fields can sit side-by-side in a row with an 8px gap (dose + units, time + site)
- Optional section begins with a 0.5px divider and a "Optional" label (11px tertiary)

Save button: full-width, teal background, white text, `border-radius: 8px`, `height: 44px`.

### FAB (floating action button)

```
width: 40px
height: 40px
border-radius: 50%
background: #1D9E75
position: absolute
bottom: 68px        /* above tab bar */
right: 16px
```

Contains a white "+" icon (Lucide `Plus`, 20px).

### Body metric stat cards (History screen)

Two cards side-by-side, equal width, `gap: 8px`.

Each card:
```
background: var(--color-background-secondary)
border-radius: 8px
padding: 10px 12px
```

Content: value (18px/500 primary) above label (10px/400 tertiary).

### Body metric trend chart (History screen)

Use Recharts `BarChart`. 7 most recent dose log entries that have associated `body_metrics`. Show weight by default; add a toggle for BF% (tap the stat card to switch).

Bar color: `#1D9E75`, most recent bar at full opacity, previous bars at 0.5 opacity.

Height: 64px. No axes, no grid lines, no tooltip. Keep it glanceable, not analytical.

### History list row

```
padding: 10px 0
border-bottom: 0.5px solid var(--color-border-tertiary)
```

Left: peptide name (13px/500 primary) + injection site (11px/400 secondary)
Right: relative timestamp (11px/400 secondary)

Expanded state (tap to reveal): slides open below the row, shows dose mcg, units, symptoms, body metrics, notes in a 12px/400 block.

### Form inputs (general)

```
height: 40px
background: var(--color-background-secondary)
border: 0.5px solid var(--color-border-tertiary)
border-radius: 8px
padding: 0 12px
font-size: 14px
color: var(--color-text-primary)
```

Focus state: `border-color: #1D9E75`, `outline: none`.

---

## Tailwind configuration

Install Tailwind CSS with Vite. Add the custom teal accent to `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',  // or 'media' for system default
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#0F6E56',
        }
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      }
    }
  }
} satisfies Config
```

Use `darkMode: 'media'` to automatically follow the OS preference with no JavaScript required.

---

## Key libraries

| Library | Purpose | Install |
|---|---|---|
| `tailwindcss` | Utility CSS | `pnpm add -D tailwindcss` |
| `shadcn/ui` | Accessible base components | via CLI per component |
| `vaul` | Bottom sheet / Drawer | `pnpm add vaul` |
| `recharts` | Bar/line charts | `pnpm add recharts` |
| `lucide-react` | Icons | `pnpm add lucide-react` |

Only install shadcn components as needed. Suggested initial set: `button`, `input`, `select`, `sheet`, `badge`, `separator`.

---

## Accessibility

- All interactive elements must have visible focus states (teal `outline` or `ring`)
- Bottom sheet must trap focus when open (vaul handles this)
- Color is never the sole indicator of meaning — dose card states use both color AND text labels
- Touch targets minimum 44×44px

---

## Screen-specific notes for Claude Code

**Home:** The dose card list should be derived from a query that joins `protocol_peptides → protocols → dose_logs` for today's date. "Due now" is determined by the peptide's scheduled time having passed without a matching `dose_logs` entry for today.

**Log dose sheet:** On open, calculate `units_drawn` from `vial.concentration_mcg_per_unit` and the `dose_mcg` value. Show the formula as a hint below the field: "Based on X mcg/unit".

**Calculator:** Pure client-side math. No API call. The formula: `concentration_mcg_per_unit = (vial_size_mg × 1000) ÷ (bac_water_ml × 100)`. Units to draw = `target_dose_mcg ÷ concentration_mcg_per_unit`.

**Photos:** The upload flow must use a Supabase signed upload URL — never send the file to the Hono backend. Pattern: (1) frontend calls `POST /api/photos/upload-url` → Hono returns a signed URL from Supabase Storage, (2) frontend `PUT`s the file directly to Supabase, (3) frontend calls `POST /api/photos` with the `storage_path` to save the metadata row.

**Protocol builder:** The multi-step flow should be a single page component with local state tracking the current step (1, 2, 3). No separate routes per step. On completion, navigate to Vial setup.
