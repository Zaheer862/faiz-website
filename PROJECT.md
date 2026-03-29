# F.AI.Z Website — V2 Improvement Project

**Business:** Faiz Mobile Accessories Ltd
**Location:** 241B Mere Road, Leicester LE5 5GS
**Contact:** 07440 423 053 | faizmobilele55gs1@gmail.com
**Goal:** Improve the site across design, mobile experience, features, and SEO — then publish on a custom domain.

---

## Project Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | UI & Visual Design Refresh | 🟡 In Progress |
| 2 | Mobile Responsiveness | ✅ Done |
| 3 | New Features & Pages | 🔲 To Do |
| 4 | Performance & SEO | 🔲 To Do |
| 5 | Local Reach & Sales Optimisation | 🔲 To Do |
| 6 | GitHub Setup & Version Control | 🔲 To Do |
| 7 | Domain Purchase & Publishing | 🔲 To Do |

---

## Phase 1 — UI & Visual Design Refresh

### Goals
- Modernise the colour palette and typography
- Improve hero section visual impact
- Add more polish to service cards and product cards
- Improve button styles and hover effects
- Better spacing and visual hierarchy throughout

### Tasks
- [x] Review and update colour variables in `style.css` — added amber/orange secondary accent, darker richer backgrounds, rounder border-radius
- [x] Improve hero section layout and animations — added animated stats bar (500+ repairs, 5★, 3yrs, 3-day), Call Now changed to amber
- [x] Redesign service cards — added WhatsApp "Book This Repair" button on each card, "Most Popular" amber badge on Screen Replacement, shimmer hover effect
- [ ] Polish product grid cards
- [x] Improve footer design — added pre-footer "Ready to Get Fixed?" CTA strip with amber Call button + WhatsApp, footer accent gradient line
- [x] Add a loading/transition effect between page sections — card shimmer sweep on hover
- [x] Consistent icon usage across the site — WhatsApp float button now has pulse ring animation

---

## Phase 2 — Mobile Responsiveness

### Goals
- Ensure the site looks and works perfectly on all screen sizes (320px–1440px+)
- Fix any layout breakpoints that feel cramped or broken on mobile
- Improve the mobile navigation experience

### Tasks
- [x] Audit all breakpoints in `style.css` — added 360px breakpoint, improved 480px and 768px
- [x] Fix hero layout on small screens — stats bar becomes 2×2 grid, buttons stack full-width, title scales with `clamp()`
- [x] Improve hamburger menu animation and usability — replaced display:none/flex toggle with opacity + visibility fade-slide; outside-tap closes menu; phone number shown in amber at top of mobile nav
- [x] Make product grid responsive — services 2-col at 768px, 1-col at 480px; filter tabs horizontal-scroll on mobile
- [x] Ensure contact section stacks correctly on mobile — single column with map below
- [x] Fix any overflow issues on mobile — filter tabs scroll horizontally, footer CTA buttons stack
- [x] Added sticky mobile CTA bar (fixed bottom bar with Call + WhatsApp) — major conversion improvement

---

## Phase 3 — New Features & Pages

### Goals
- Add features that turn visitors into customers

### Tasks
- [ ] **Online Repair Booking Form** — simple form: name, device, issue, preferred date, contact number → sends a WhatsApp message or email
- [x] **Repair Price List page** — prices.html with iPhone/Samsung/Other, Tablets, Laptops tabs
- [ ] **Real Blog System** — replace placeholder blog cards with actual editable blog posts (could be simple markdown files or a JSON-based approach)
- [ ] **Google Reviews integration** — pull in or display real Google reviews (or add a "Leave a Review" CTA)
- [ ] **WhatsApp Chat Widget upgrade** — show a chat bubble with a pre-filled opening message
- [ ] **Social media links** — connect actual Facebook, Instagram, TikTok pages
- [ ] **Cookie consent banner** — GDPR-compliant for UK visitors

---

## Phase 4 — Performance & SEO

### Goals
- Pass Core Web Vitals (LCP, CLS, FID)
- Rank for local search terms in Leicester

### Tasks
- [ ] Add `<meta>` Open Graph tags for social sharing previews
- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Compress and optimise all images (add real product/shop photos)
- [ ] Lazy load all images properly
- [ ] Minify CSS and JS for production build
- [ ] Add `schema.org` structured data for local business (name, address, phone, hours)
- [ ] Add `schema.org` for repair services
- [ ] Ensure all pages have unique `<title>` and `<meta description>` tags
- [ ] Add canonical URLs
- [ ] Add `alt` text to all images

---

## Phase 5 — Local Reach & Sales Optimisation

### Goals
- Get found by people in Leicester searching for repairs
- Convert more visitors into phone calls and WhatsApp messages

### Tasks
- [ ] **Google Business Profile** — make sure the website URL is updated on Google Maps listing
- [ ] **Local keywords** — add "Leicester" to more headings and page copy where natural
- [ ] **"Near Me" optimisation** — add area-specific content (Mere Road, LE5, East Leicester)
- [ ] **Trust signals** — add repair count stats ("500+ repairs completed"), years in business, etc.
- [ ] **Urgency CTAs** — "Same-day repairs available", "Walk in today"
- [ ] **Click-to-call prominently** on mobile — phone number always visible at top
- [ ] **WhatsApp quick-reply buttons** on each service card
- [ ] Add a "Get a Free Quote" section that links to WhatsApp with device pre-filled
- [ ] Add customer photo testimonials (if available)

---

## Phase 6 — GitHub Setup & Version Control

### Goals
- Track all changes with Git
- Keep a clean version history before publishing

### Tasks
- [ ] Initialise Git repo in this folder (`git init`)
- [ ] Create first commit with v1 baseline (current site)
- [ ] Create GitHub repository (public or private)
- [ ] Push v1 to GitHub
- [ ] Work on improvements in feature branches
- [ ] Merge improvements into `main` branch when ready to publish

### Suggested Branch Structure
```
main          ← production-ready code
dev           ← active development
feature/ui    ← Phase 1 UI changes
feature/seo   ← Phase 4 SEO improvements
```

---

## Phase 7 — Domain Purchase & Publishing

### Goals
- Get the site live on a proper domain that customers can visit

### Recommended Domain Options
| Domain | Notes |
|--------|-------|
| `faizmobiles.co.uk` | Best option — matches the business |
| `faizmobileaccessories.co.uk` | Full business name |
| `faizmobiles.com` | International version |

**Recommended registrar:** Namecheap or Cloudflare Registrar (good prices, easy DNS)

### Recommended Hosting
- **Netlify** (free tier) — drag-and-drop deploy, custom domain, free SSL, fast CDN
- **Cloudflare Pages** (free tier) — excellent performance, connects to GitHub

### Publishing Steps
- [ ] Purchase domain (suggest: `faizmobiles.co.uk`)
- [ ] Set up Netlify account and connect GitHub repo
- [ ] Configure custom domain in Netlify
- [ ] Add DNS records at domain registrar pointing to Netlify
- [ ] Enable HTTPS/SSL (Netlify does this automatically)
- [ ] Test live site on custom domain
- [ ] Update Google Business Profile with new URL
- [ ] Submit sitemap to Google Search Console

---

## Files in This Project

| File | Purpose |
|------|---------|
| `index.html` | Main homepage |
| `style.css` | All homepage styles |
| `script.js` | Homepage interactions, product loading |
| `shop.html` | Online shop page |
| `shop.css` | Shop page styles |
| `shop.js` | Cart and shop logic |
| `admin.html` | Admin panel |
| `admin.css` | Admin styles |
| `admin.js` | Admin logic |
| `prices.html` | Repair prices page (phones, tablets, laptops) |
| `prices.css` | Repair prices page styles |
| `prices.js` | Repair prices page script |
| `products.json` | Product catalogue — 27 products across 5 brands (prices 10% above Amazon UK) |
| `PROJECT.md` | This file — project roadmap |
| `README.md` | Developer setup guide |
| `.gitignore` | Files to exclude from Git |

---

## Notes

- Always test changes in a browser before committing to Git
- Keep `products.json` updated with real stock
- When adding real photos, put them in an `img/` folder
- Ask Zee for login details to Google Business Profile before updating

---

*Project created: March 2026 — F.AI.Z Website V2*
