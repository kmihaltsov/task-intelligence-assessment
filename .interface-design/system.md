# Design System — Task Intelligence Dashboard

## Intent

**Who:** Tech leads and PMs triaging project tasks — context-switching, slightly overwhelmed, need structured clarity fast.

**What they do:** Paste raw tasks, watch AI analyze them in real time, then review/filter/edit the structured output.

**Feel:** Like watching a sharp colleague organize your whiteboard. Warm enough to trust, crisp enough to take seriously. Structured thought appearing on a clean surface.

---

## Palette

### Ground (warm stone — not clinical gray)
- `ground-50: #FAFAF8` — page background
- `ground-100: #F5F4F0` — recessed areas
- `ground-200: #ECEAE4` — deeper recesses

### Neutral (warm slate undertone)
Full scale from `neutral-50` (#FAFAF8) to `neutral-950` (#0F0F1A). Text uses `neutral-900` (#1A1A2E) — slightly warm, not flat black.

### Accent (indigo-violet — warmer than stock indigo)
- Interactive elements, focus rings, primary buttons
- `accent-500: #5B5BD6` — primary
- `accent-600: #4C3FC7` — hover
- `accent-700: #3F33AB` — active

### Intelligence (amber — signals AI reasoning)
- Used when AI is actively thinking/analyzing
- `intel-400: #D4A843` — running step dots, pulse indicator
- `intel-500: #C4952E` — reasoning log icons
- `intel-600: #A67A22` — "Analyzing" label

### Priority
- Critical: `#E5484D` (red)
- High: `#E5702A` (orange)
- Medium: `#D4A843` (amber — ties to intelligence palette)
- Low: `#30A46C` (green)

---

## Depth

Shadow-based separation, not border-heavy.

- **Cards:** `shadow-card` (subtle warm shadow) → `shadow-card-hover` on hover
- **Inputs:** `shadow-card` resting, `shadow-card-hover` on focus
- **Nav:** `shadow-sm` instead of bottom border
- **No borders on containers** — shadows define elevation
- **1px rings only on interactive inputs** (selects, inline edit fields)

---

## Surfaces

Two elevations:
1. **Ground** (`bg-ground-50`) — page background
2. **Card** (`bg-white shadow-card rounded-xl`) — all elevated content

Cards use `rounded-xl` (12px radius). Inner elements stay `rounded-md` or `rounded-lg`.

---

## Typography

- **Font:** Inter (sans), JetBrains Mono (mono)
- **Headings:** `-0.025em` letter-spacing (tighter tracking)
- **Hierarchy:**
  - Page titles: `text-2xl font-semibold`
  - Card headings: `text-sm font-semibold`
  - Body: `text-sm`
  - Meta/labels: `text-xs`
  - Data values: `text-xs font-mono`

---

## Spacing

- Base unit: 4px
- Card padding: 20px (`p-5`) for standard, 24px (`p-6`) for pipeline views
- Section gaps: 16px (`space-y-4`) between cards
- Page margins: 40px top padding (`py-10`)

---

## Signature Elements

### Intelligence Pulse
Amber glow animation (`intel-pulse`) on active AI steps. Replaces generic CSS `animate-pulse` during reasoning moments. Communicates "the AI is thinking" without being a spinner.

### Pipeline as Main Event
The step indicator and reasoning timeline are elevated to primary visual importance — same card treatment as content, not a sidebar or overlay.

### Shadow Hover Feedback
Cards shift from `shadow-card` to `shadow-card-hover` on hover — a gentle lift that signals interactivity without borders or color changes.

---

## Component Patterns

| Component | Surface | Depth | Corner |
|-----------|---------|-------|--------|
| Card | `bg-white` | `shadow-card` | `rounded-xl` |
| Button (primary) | `bg-accent-600` | `shadow-sm` | `rounded-lg` |
| Button (secondary) | `bg-white` | `shadow-xs ring-1 ring-neutral-200` | `rounded-lg` |
| Badge | colored bg | none | `rounded-md` |
| Input/Textarea | `bg-white` | `shadow-card` | `rounded-xl` |
| Select | `bg-white` | `shadow-xs ring-1 ring-neutral-200` | `rounded-lg` |
| Error state | `bg-red-50` | `shadow-card ring-1 ring-inset ring-red-200/60` | `rounded-xl` |
| Success state | `bg-emerald-50` | `shadow-card ring-1 ring-inset ring-emerald-200/60` | `rounded-xl` |

---

## React Patterns

- Function components with default params (no `defaultProps`)
- `ref` as prop (no `forwardRef`) per React 19
- Event handlers over `useCallback` for simple cases
- No manual memoization (React Compiler handles it)
