# NewsHub – Global Style Language

## Core Framework
All UI elements use **TailwindCSS** for layout, spacing, and colour utility classes.  
Component patterns come from **Shadcn/UI** — cards, tables, modals, buttons, tabs, etc.  
The visual identity should feel:  
**calm**, **precise**, and **editorial** — like a tool journalists actually use.

---

## ⚙️ Base Settings

### Typography
| Element | Font | Weight | Notes |
|----------|-------|--------|-------|
| Headings | `font-sans` (e.g., Inter, Sans) | `font-semibold` | Use Tailwind text sizes `text-2xl` to `text-4xl` |
| Body | `font-sans` | `font-normal` | Use `text-sm` or `text-base` for most content |
| Code / Meta | `font-mono` | `font-medium` | For IDs, timestamps, and metadata |

- Letter spacing: slightly tight (`tracking-tight`)
- Line height: `leading-snug` for compact blocks

---

### Colours
Neutral, high-contrast palette with muted accents.

| Use | Class | Example |
|------|--------|---------|
| Background | `bg-background` | `bg-slate-950 dark:bg-slate-50` |
| Card | `bg-card` | `bg-slate-900/40 dark:bg-white/80` |
| Text | `text-foreground` | `text-slate-100 dark:text-slate-800` |
| Accent | `text-accent` / `bg-accent` | `bg-blue-600 hover:bg-blue-700` |
| Success | `text-green-500` |
| Warning | `text-yellow-500` |
| Error | `text-red-500` |

Use subtle shadows (`shadow-sm`, `shadow-md`) and `rounded-2xl` for soft corners.

---

### Layout
- Default container width: `max-w-7xl mx-auto px-6`
- Responsive grid for dashboards:  
  - 4-column desktop  
  - 2-column tablet  
  - single column mobile
- Persistent sidebar width: `w-72`
- Gaps: `gap-4` between cards and list items

---

## 🧩 Components

### Buttons
Use Shadcn’s `Button` component.

| Type | Class | Description |
|------|--------|-------------|
| Primary | `bg-blue-600 text-white hover:bg-blue-700` | Core actions (Run Analysis, Save) |
| Secondary | `bg-muted text-foreground hover:bg-muted/80` | Neutral actions |
| Destructive | `bg-red-600 text-white hover:bg-red-700` | Delete / Reset |
| Ghost | `hover:bg-accent/10` | Minimal icons or nav items |

Buttons use `rounded-lg px-4 py-2 text-sm font-medium transition`.

---

### Cards
Use `Card` from Shadcn for modular panels (projects, articles, etc.)

Structure:
```jsx
<Card className="shadow-md rounded-2xl border border-slate-800/20">
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
    <CardDescription>Last analysed 5 Oct 2025</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

---

### Tables
Use Shadcn’s table components with Tailwind borders.

| Row state | Style |
|------------|--------|
| Default | `hover:bg-muted/40 cursor-pointer transition` |
| Expanded | `border-l-4 border-blue-600` |
| Header | `bg-muted/60 text-xs uppercase tracking-wide` |

Table cells use `px-4 py-2 text-sm`.

---

### Modals
Use `Dialog` from Shadcn.  
- Rounded corners: `rounded-2xl`  
- Drop shadow: `shadow-xl`  
- Backdrop: semi-transparent dark overlay (`bg-black/50`)  
- Animation: fade-in scale (Framer Motion optional)

---

### Tabs
Use Shadcn’s `Tabs` component.  
Active tab: `border-b-2 border-blue-600 text-blue-600 font-medium`  
Inactive: `text-muted-foreground hover:text-foreground`

---

### Forms
- Inputs: `border border-slate-700/50 rounded-lg bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600`
- Labels: `text-sm font-medium text-muted-foreground`
- Error text: `text-red-500 text-xs mt-1`

---

### Icons
Use **Lucide** (`lucide-react`) — light, clean vector icons.  
Size 16–20px.  
Icon colour matches current text colour (`text-foreground`).

---

### Animations
Use **Framer Motion** for subtle transitions:
- Fade in lists and modals (`opacity: 0 → 1`)
- Scale buttons slightly on hover
- Collapse/expand transitions for article rows

---

## 🧭 Interaction Patterns
- Hover feedback on all clickable items (`hover:bg-muted/40`)
- Use tooltips for icon-only actions (`Info`, `Delete`, `Edit`)
- Progress bars (`h-2 rounded-full bg-slate-700`) for queue status
- Skeleton loaders for table content during fetch

---

## 🧱 Layout Components
| Component | Description |
|------------|-------------|
| `AppShell` | Sidebar + header wrapper |
| `DashboardCard` | Generic info block with heading + metric |
| `DataTable` | Paginated, virtualised list |
| `StatusBadge` | Rounded pill showing sentiment or status |
| `ModalConfirm` | Generic confirmation dialog |
| `Toast` | Shadcn toast notifications (success / error) |

---

## 🧠 UX Rules
- Prefer in-page modals over full-page navigation where possible (keep user in context).  
- Always give feedback: toast on save, spinner on fetch.  
- Use icons + colour for state: green = done, blue = running, red = error.  
- Respect user theme (light/dark) automatically.  
- Avoid overcrowding: at least `p-4` padding in every major container.

---

## 🧾 Naming Conventions
Use **PascalCase** for React components (e.g., `ProjectCard.tsx`).  
Use **kebab-case** for CSS/utility class groupings if custom ones are ever defined.  
Keep components modular and stateless whenever possible.

---

## 🔖 References
Shadcn documentation: [https://ui.shadcn.com](https://ui.shadcn.com)  
Lucide icons: [https://lucide.dev/icons](https://lucide.dev/icons)  
Tailwind utilities: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
