# Icarus Down Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, English-only website for the band Icarus Down (home page plus Press / Booking page), edited in Pages CMS and published to `https://alanone.github.io/icarus-down/`.

**Architecture:** Astro builds Markdown/JSON content into plain HTML. Date logic (past shows, upcoming releases) lives in small pure TypeScript modules used both at build time and by one small client script, so the page corrects itself on the day without a rebuild. GitHub Actions tests, builds and deploys on every push and once a day.

**Tech Stack:** Astro 7.4 (needs Node >= 22.23.4), TypeScript, Vitest 5 (+ happy-dom for the client script), Pages CMS, GitHub Pages via GitHub Actions, pa11y-ci for the accessibility check.

**Spec:** `docs/superpowers/specs/2026-11-17-icarus-down-website-design.md`

**Location:** the project folder is `C:\Users\Alan\Work\icarus-down` on AlanOne's Windows PC. It already contains `docs/` (spec and plan) and `assets-inbox/` (band photos and logo as AlanOne supplied them). Build in place there, and all paths in this plan are relative to it.

## Global Constraints

- English only. All copy in US English.
- Repo `icarus-down` (public). Astro `site: 'https://alanone.github.io'`, `base: '/icarus-down'`. The base path is set in exactly one place (`astro.config.mjs`). Every internal link and asset path goes through `url()` from `src/lib/paths.ts` or Astro's `import.meta.env.BASE_URL`. No hard-coded leading `/` paths in markup.
- Time zone for all "is it past / is it out" decisions: `Europe/Ljubljana`.
- A show is listed through the whole of its date and disappears the day after.
- A release is "upcoming" while its date is after today, and "out" from its date onward.
- Dates are stored and compared as `YYYY-MM-DD` strings, never as `Date` objects at midnight UTC.
- Videos load click-to-play from `youtube-nocookie.com`. No third-party request before the click. Music uses link buttons, not embedded players.
- No analytics, no cookies, no cookie banner.
- Press photos in the repo: web-ready, at most about 3000 px on the long edge. Full-resolution originals go behind the optional external link only.
- Sections with no content are not rendered, and their nav links are hidden too.
- Mobile-first. WCAG 2.2 AA.
- Free hosting only. No server, no database, no paid service.

## Review Focus

1. **A visitor in another time zone on a show's last day** (for example a promoter in New York at 23:00 local, which is already the next day in Ljubljana): the show is hidden exactly when it is hidden for a visitor in Ljubljana. Tested in Task 2.
2. **A release on its release day with no listen links and no pre-save link**: no empty button row and no dead link. With only a pre-save link, a single "Listen" button pointing to it. Tested in Task 3.
3. **The github.io sub-path**: every `href`/`src` in the built HTML that starts with `/` starts with `/icarus-down/`. One stray `/favicon.svg` silently 404s. Tested in Task 1 and re-run on full output in Task 10.
4. **YouTube URLs pasted in any common form** (`youtu.be/ID`, `watch?v=ID&t=30s`, `/shorts/ID`, `music.youtube.com/watch?v=ID`, `/embed/ID`): the ID is parsed. An unparseable URL drops that video instead of rendering a broken player. Tested in Task 8.
5. **Empty optional fields saved by Pages CMS as `""`** instead of being absent: treated as absent everywhere (no `href=""` buttons, no empty social icons, schema does not reject the entry). Tested in Task 4.

---

## File Structure

```
C:\Users\Alan\Work\icarus-down\
  assets-inbox/                    AlanOne's original photos and logo (git-ignored)
  astro.config.mjs                 site, base
  package.json                     scripts: dev, build, preview, test, test:build, a11y
  vitest.config.ts
  .nvmrc                           22.23.4
  .pages.yml                       Pages CMS config
  .pa11yci.json
  .github/workflows/deploy.yml     test, build, deploy, push + daily cron
  docs/superpowers/...             spec and this plan
  public/favicon.svg
  public/files/                    tech rider PDF (Pages CMS "files" media)
  src/
    content.config.ts              collections: shows, releases, videos, members
    content/shows/*.md             frontmatter only
    content/releases/*.md
    content/videos/*.md
    content/members/*.md
    data/site.json                 band info, press kit, social links, share image
    assets/media/                  images (Pages CMS "images" media)
    lib/
      paths.ts                     url()
      dates.ts                     todayIn(), isBefore(), formatShowDate(), formatReleaseDate()
      shows.ts                     upcomingShows()
      releases.ts                  releaseStatus(), featuredRelease(), musicOrder(), listenLinks()
      youtube.ts                   youtubeId(), thumbnailUrl(), embedUrl()
      media.ts                     resolveMedia()
      site-schema.ts               siteSchema (zod), optionalUrl, optionalString
      sections.ts                  sectionsToRender()
    scripts/live-dates.ts          applyLiveDates() client script
    layouts/Base.astro             head, meta, Open Graph, global styles
    styles/tokens.css              from Task 6 (visual direction)
    styles/global.css
    components/
      Header.astro  Footer.astro  Hero.astro  Shows.astro  Music.astro
      ReleaseCard.astro  ListenButtons.astro  Videos.astro  LiteYouTube.astro
      About.astro  PressKit.astro
    pages/index.astro
    pages/press.astro
  tests/
    unit/*.test.ts
    build/output.test.ts           runs against dist/ after a build
```

---

### Task 1: Project scaffold, base path and deploy pipeline

**Files:**
- Create: `package.json`, `astro.config.mjs`, `vitest.config.ts`, `.nvmrc`, `.gitignore`, `src/lib/paths.ts`, `src/pages/index.astro` (placeholder heading), `public/favicon.svg`, `.github/workflows/deploy.yml`
- Test: `tests/unit/paths.test.ts`, `tests/build/output.test.ts`

**Interfaces:**
- Produces: `url(path: string): string` in `src/lib/paths.ts`. It joins `import.meta.env.BASE_URL` and `path` with exactly one `/` between them. It returns absolute `http(s):`, `mailto:` and `tel:` URLs unchanged.
- Produces: npm scripts `test` (`vitest run tests/unit`), `test:build` (`vitest run tests/build`), `build` (`astro build`).

- [ ] **Step 1: Write the failing tests**

`tests/unit/paths.test.ts`, with `BASE_URL` stubbed to `/icarus-down/` via `vi.stubEnv` or a vitest `define`:
```ts
expect(url('press/')).toBe('/icarus-down/press/')
expect(url('/press/')).toBe('/icarus-down/press/')
expect(url('')).toBe('/icarus-down/')
expect(url('https://open.spotify.com/x')).toBe('https://open.spotify.com/x')
expect(url('mailto:booking@example.com')).toBe('mailto:booking@example.com')
```

`tests/build/output.test.ts`: `it('prefixes every root-relative href and src with /icarus-down/')`. It reads every `dist/**/*.html`, collects `href="/..."` and `src="/..."` (and `srcset` entries), and asserts each starts with `/icarus-down/`.

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test` - Expected: FAIL (`url` not defined).

- [ ] **Step 3: Scaffold and implement**

Run `npm create astro@latest .` inside the existing folder (minimal template, TypeScript strict), keeping `docs/` and `assets-inbox/`. Then `git init` and add `vitest@5` and `happy-dom`. Add `assets-inbox/` to `.gitignore`, since originals stay out of the repo and only web-ready copies go into `src/assets/media/`. `astro.config.mjs`: `site: 'https://alanone.github.io'`, `base: '/icarus-down'`, `trailingSlash: 'always'`. Implement `url()`. The placeholder `index.astro` links the favicon through `url('favicon.svg')`.

`deploy.yml`: triggers `push` to `main`, `workflow_dispatch`, and `schedule: cron '15 23 * * *'` (00:15 Ljubljana in winter, 01:15 in summer, both fine). Job `build`: checkout, setup-node from `.nvmrc`, `npm ci`, `npm test`, `npm run build`, `npm run test:build`, `actions/upload-pages-artifact` with `dist`. Job `deploy`: `actions/deploy-pages`. Permissions `pages: write`, `id-token: write`.

- [ ] **Step 4: Run and confirm they pass**

Run: `npm test && npm run build && npm run test:build` - Expected: all PASS.

- [ ] **Step 5: Commit** (include the spec and this plan under `docs/`)

```bash
git add -A && git commit -m "feat: scaffold Astro site with base path and Pages deploy"
```

---

### Task 2: Date and show logic

**Files:**
- Create: `src/lib/dates.ts`, `src/lib/shows.ts`
- Test: `tests/unit/dates.test.ts`, `tests/unit/shows.test.ts`

**Interfaces:**
- Produces: `const TZ = 'Europe/Ljubljana'`
- Produces: `todayIn(now: Date, tz = TZ): string`, which returns `YYYY-MM-DD` using `Intl.DateTimeFormat('en-CA', { timeZone: tz })`
- Produces: `isBefore(a: string, b: string): boolean` (string compare of `YYYY-MM-DD`)
- Produces: `formatShowDate(date: string, today: string): string`. Returns `Sat 12 Dec`, with ` 2027` appended when the year differs from `today`'s year.
- Produces: `formatReleaseDate(date: string, today: string): string`. Returns `12 Dec`, same year rule.
- Produces: `type Show = { slug: string; date: string; venue: string; city: string; country?: string; ticketUrl?: string; note?: string }`
- Produces: `upcomingShows(shows: Show[], today: string): Show[]`. Keeps shows with `date >= today`, sorted by date ascending, then by venue.

- [ ] **Step 1: Write the failing tests**

```ts
// dates
expect(todayIn(new Date('2026-12-12T22:59:00Z'))).toBe('2026-12-12') // 23:59 Ljubljana
expect(todayIn(new Date('2026-12-12T23:00:00Z'))).toBe('2026-12-13') // 00:00 Ljubljana
expect(todayIn(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01') // summer time, 23:59
expect(formatShowDate('2026-12-12', '2026-11-17')).toBe('Sat 12 Dec')
expect(formatShowDate('2027-01-09', '2026-11-17')).toBe('Sat 9 Jan 2027')
expect(formatReleaseDate('2026-12-04', '2026-11-17')).toBe('4 Dec')
// shows
it('keeps a show for the whole of its date and drops it the day after')
  // today '2026-12-12' keeps date '2026-12-12', today '2026-12-13' drops it
it('sorts by date, then venue')
it('returns [] for no shows')
it('a New York visitor at 23:00 local on 12 Dec sees the same list as Ljubljana')
  // upcomingShows(shows, todayIn(new Date('2026-12-13T04:00:00Z'))) drops the 12 Dec show
```

- [ ] **Step 2: Run and confirm they fail** - `npm test` - FAIL.
- [ ] **Step 3: Implement the functions above.**
- [ ] **Step 4: Run and confirm they pass** - `npm test` - PASS.
- [ ] **Step 5: Commit** - `git commit -m "feat: date and upcoming-show logic in Ljubljana time"`

---

### Task 3: Release logic

**Files:**
- Create: `src/lib/releases.ts`
- Test: `tests/unit/releases.test.ts`

**Interfaces:**
- Consumes: `isBefore` from Task 2.
- Produces:
```ts
type ReleaseLinks = { spotify?: string; appleMusic?: string; bandcamp?: string; youtubeMusic?: string; other?: { label: string; url: string } }
type Release = { slug: string; title: string; type: 'single' | 'ep' | 'album'; date: string; cover: string; presaveUrl?: string; links: ReleaseLinks }
type ListenLink = { label: string; url: string }
releaseStatus(r: Release, today: string): 'upcoming' | 'out'
featuredRelease(rs: Release[], today: string): Release | null   // nearest upcoming, else newest out, else null
musicOrder(rs: Release[], today: string): Release[]             // upcoming (soonest first), then out (newest first)
listenLinks(r: Release): ListenLink[]                           // order: Spotify, Apple Music, Bandcamp, YouTube Music, other
```
- `listenLinks` labels are exactly `Spotify`, `Apple Music`, `Bandcamp`, `YouTube Music`, and `other.label`. When no link is set and `presaveUrl` is set, it returns `[{ label: 'Listen', url: presaveUrl }]`. When neither is set, it returns `[]`.

- [ ] **Step 1: Write the failing tests**

```ts
it('is upcoming the day before its date and out on its date')
it('features the nearest upcoming release over a newer out release')
it('features the next upcoming release once the nearest one is out')
  // two upcoming (12 Dec, 20 Feb), today 12 Dec -> features 20 Feb
it('features the newest out release when none is upcoming')
it('returns null with no releases')
it('orders music: upcoming soonest first, then out newest first')
it('lists listen links in platform order and skips missing ones')
it('falls back to a single Listen link to the pre-save URL')
it('returns no links when there are neither listen links nor a pre-save URL')
```

- [ ] **Step 2: Run and confirm they fail** - `npm test` - FAIL.
- [ ] **Step 3: Implement the functions above.**
- [ ] **Step 4: Run and confirm they pass** - `npm test` - PASS.
- [ ] **Step 5: Commit** - `git commit -m "feat: release status, featured release and listen links"`

---

### Task 4: Content model, media resolver and seed content

**Files:**
- Create: `src/content.config.ts`, `src/lib/site-schema.ts`, `src/lib/media.ts`, `src/data/site.json`, seed files in `src/content/{shows,releases,videos,members}/`, placeholder images in `src/assets/media/`
- Test: `tests/unit/site-schema.test.ts`, `tests/unit/media.test.ts`

**Interfaces:**
- Consumes: the types from Tasks 2 and 3 (collection entries map onto `Show` and `Release` with `slug = entry.id`).
- Produces in `site-schema.ts`: `optionalString` and `optionalUrl` (zod: accept `undefined`, `''` or a valid value, and output `undefined` for `''`). Also `dateString` (regex `^\d{4}-\d{2}-\d{2}$`), `siteSchema`, `type Site = z.infer<typeof siteSchema>`, and `loadSite(): Site` (parses `src/data/site.json`).
- `siteSchema` shape:
```ts
{ band: { name, shortBio, longBio, heroPhoto },
  press: { photos: { image, caption, credit? }[], fullResKitUrl?, techRider?, bookingEmail, bookingPhone? },
  social: { instagram?, facebook?, youtube?, spotify?, bandcamp?, tiktok?, other?: { label, url }[] },
  shareImage }
```
- Collections in `content.config.ts` use `glob({ pattern: '*.md', base: './src/content/<name>' })` from `astro/loaders` and the shared zod helpers. `shows`: date, venue, city, country?, ticketUrl?, note?. `releases`: title, type, date, cover, presaveUrl?, links{...}. `videos`: title, url, date. `members`: name, role, photo?, order (number).
- Produces in `media.ts`: `resolveMedia(path: string): ImageMetadata | undefined`. It looks up `path` (as stored by Pages CMS, for example `/src/assets/media/Band Photo.JPG`) in `import.meta.glob('/src/assets/media/*', { eager: true, import: 'default' })`.
- Seed content: three shows (one past, one this month, one next year), three releases (one upcoming with only a pre-save link, two out), three videos, four members. All clearly placeholder text. One file each with an empty-string optional field.

- [ ] **Step 1: Write the failing tests**

```ts
it('treats empty-string optional fields as absent')   // { ticketUrl: '' } parses to ticketUrl === undefined
it('rejects a malformed date')                         // '12.12.2026' fails dateString
it('rejects a non-URL ticket link')
it('parses the committed site.json')
it('resolves a stored media path, including spaces and upper-case extensions')
it('returns undefined for a missing media path')
```

- [ ] **Step 2: Run and confirm they fail** - `npm test` - FAIL.
- [ ] **Step 3: Implement the schema, collections and resolver, and add the seed content.**
- [ ] **Step 4: Run and confirm they pass** - `npm test && npm run build` - PASS, and the build reports no content errors.
- [ ] **Step 5: Commit** - `git commit -m "feat: content collections, site data schema and seed content"`

---

### Task 5: Pages CMS configuration

**Files:**
- Create: `.pages.yml`
- Test: `tests/unit/pages-cms.test.ts`

**Interfaces:**
- Consumes: the field names from Task 4 (they must match exactly).
- Media: two named entries. `images`: input `src/assets/media`, output `/src/assets/media`, extensions jpg/jpeg/png/webp/avif. `files`: input `public/files`, output `/files`, extension pdf. (`/files/...` is rendered through `url()`.)
- Content: collections `shows`, `releases`, `videos`, `members` (type `collection`, `path: src/content/<name>`, `format: yaml-frontmatter`), and a `file` entry `site` (`path: src/data/site.json`, `format: json`). Labels in plain English ("Shows", "Releases", "Band & press"). Date fields use the `date` type with `format: yyyy-MM-dd`. Release `type` is a `select` with options single / EP / album. `members.order` is a `number`.
- Check the field-type names and media syntax against the current docs at pagescms.org before writing.

- [ ] **Step 1: Write the failing test**

`it('declares every schema field for every collection and the site file')`. It parses `.pages.yml` with `yaml` and walks the fields, recursing into objects and lists. It asserts the set of field names equals the zod shape keys for each collection and for `siteSchema`. It also asserts each `path` exists on disk.

- [ ] **Step 2: Run and confirm it fails** - FAIL (file missing).
- [ ] **Step 3: Write `.pages.yml`.**
- [ ] **Step 4: Run and confirm it passes** - `npm test` - PASS.
- [ ] **Step 5: Commit** - `git commit -m "feat: Pages CMS configuration"`

---

### Task 6: Visual direction (with AlanOne, before any styling)

Not code. The look is AlanOne's decision. Show him 2-3 mockups of the home hero and the shows list (the visual companion or a quick HTML page), using the band's real photo and logo if he has them. Record his choice as:

**Files:**
- Create: `src/styles/tokens.css` (custom properties: `--color-bg`, `--color-text`, `--color-accent`, `--color-muted`, `--font-display`, `--font-body`, the type scale `--step--1`..`--step-4`, `--space-1`..`--space-8`, `--radius`, `--max-width`)
- Create: `docs/visual-direction.md` (5-10 lines: the chosen mockup, fonts and where they load from, accent use, photo treatment)

- [ ] **Step 1: Show the mockups and get AlanOne's pick.**
- [ ] **Step 2: Write the tokens and notes. Check that text/background and accent/background contrast is >= 4.5:1.**
- [ ] **Step 3: Commit** - `git commit -m "docs: visual direction and design tokens"`

Fonts are self-hosted (for example via `@fontsource`). No Google Fonts request, to keep "no third-party request".

---

### Task 7: Layout, header, footer, Shows and About sections

**Files:**
- Create: `src/layouts/Base.astro`, `src/styles/global.css`, `src/lib/sections.ts`, `src/components/{Header,Footer,Shows,About}.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/sections.test.ts`, `tests/build/output.test.ts` (add cases)

**Interfaces:**
- Consumes: `url`, `upcomingShows`, `formatShowDate`, `todayIn`, `loadSite`, `resolveMedia`, collection data.
- Produces: `type SectionId = 'music' | 'videos' | 'shows' | 'about'` and `sectionsToRender(c: { releases: number; videos: number; upcomingShows: number; members: number; shortBio: string }): SectionId[]`, in nav order Music, Videos, Shows, About. `about` is included when there is a short bio or at least one member.
- Produces: `Base.astro` props `{ title: string; description: string; path: string }`. It renders `<title>`, the meta description, canonical, `og:title/description/url/image` (absolute URL from `site` + `url(shareImage)`), `twitter:card=summary_large_image`, `lang="en"`, a skip link, and imports `tokens.css` and `global.css`.
- Each show renders as `<li data-show-date="YYYY-MM-DD">` (Task 9 relies on this attribute). Tickets is a real link with an accessible name ("Tickets for <venue>, <city>"), and it is omitted when there's no ticket URL.
- Header nav lists only `sectionsToRender` entries plus "Press" (always). Footer: social links that are set (icon with a visually hidden label), and a `mailto:` booking link.

- [ ] **Step 1: Write the failing tests**

```ts
it('omits sections with no content, in nav order')
  // sectionsToRender({ releases: 2, videos: 0, upcomingShows: 0, members: 0, shortBio: '' }) -> ['music']
it('includes about with only a short bio')
// build
it('home page has one h1, lang="en", og:image as an absolute https URL')
it('does not list the seeded past show')
it('every show <li> carries data-show-date')
```

- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement the layout, components and `sectionsToRender`, styled from `tokens.css`.**
- [ ] **Step 4: Run** `npm test && npm run build && npm run test:build` - PASS. Check it at 360 px and 1280 px wide with `npm run preview`.
- [ ] **Step 5: Commit** - `git commit -m "feat: base layout, header, footer, shows and about"`

---

### Task 8: Releases (Hero and Music) and Videos

**Files:**
- Create: `src/lib/youtube.ts`, `src/components/{Hero,Music,ReleaseCard,ListenButtons,Videos,LiteYouTube}.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/youtube.test.ts`, `tests/build/output.test.ts` (add cases)

**Interfaces:**
- Consumes: `featuredRelease`, `musicOrder`, `releaseStatus`, `listenLinks`, `formatReleaseDate`, `resolveMedia`, `url`.
- Produces: `youtubeId(url: string): string | null`, `thumbnailUrl(id: string): string` (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`), `embedUrl(id: string): string` (`https://www.youtube-nocookie.com/embed/<id>?autoplay=1`).
- Thumbnails are downloaded at build time into the output, so there is no request to YouTube before a click. Use Astro `<Image>` with `inferSize` from the remote URL, which needs `image: { domains: ['i.ytimg.com'] }` in `astro.config.mjs`, or fetch them to `src/assets` in a build step.
- `ReleaseCard` and `Hero` render **both** states in markup: `<div data-release-date="YYYY-MM-DD">` containing `[data-state="upcoming"]` ("Out 12 Dec" / "Coming 12 Dec" plus a Pre-save link, when a pre-save URL is set) and `[data-state="out"]` (`ListenButtons`). The state that is wrong at build time gets the `hidden` attribute. `ListenButtons` renders nothing when `listenLinks` is empty.
- Hero renders one `[data-hero-candidate]` per release that can be featured before the next build: every upcoming release plus the newest out release. Each carries `data-release-date`, and all but the build-time `featuredRelease` are `hidden`. With no releases, the hero shows the band photo and name only.
- `LiteYouTube`: a `<button>` with the thumbnail and an accessible name "Play video: <title>". On click it swaps itself for the iframe (`title` attribute set, `allow="autoplay; encrypted-media; picture-in-picture"`, `allowfullscreen`). Videos with `youtubeId() === null` are dropped at build time with a console warning.

- [ ] **Step 1: Write the failing tests**

```ts
expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe('dQw4w9WgXcQ')
expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
expect(youtubeId('https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc')).toBe('dQw4w9WgXcQ')
expect(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
expect(youtubeId('https://vimeo.com/123')).toBeNull()
expect(youtubeId('not a url')).toBeNull()
// build
it('makes no request to youtube.com, youtube-nocookie.com or ytimg.com before interaction')
  // no <iframe>, no <img src> or <link> pointing at those hosts in dist/index.html
it('renders the seeded upcoming release with Pre-save visible and listen buttons hidden')
it('renders no anchor with an empty href')
```

- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test && npm run build && npm run test:build` - PASS. Click a video in `npm run preview` and confirm it plays.
- [ ] **Step 5: Commit** - `git commit -m "feat: hero, music and click-to-play videos"`

---

### Task 9: Live dates client script

**Files:**
- Create: `src/scripts/live-dates.ts`
- Modify: `src/pages/index.astro` (load it with a `<script>` tag that Astro bundles)
- Test: `tests/unit/live-dates.test.ts` (`// @vitest-environment happy-dom`)

**Interfaces:**
- Consumes: `todayIn`, `isBefore`, and the markup contract from Tasks 7 and 8 (`data-show-date`, `data-release-date`, `data-state`, `data-hero-candidate`).
- Produces: `applyLiveDates(root: ParentNode, now: Date): void`. It sets `hidden` on `[data-show-date]` older than today. It toggles each `[data-release-date]` block's `[data-state]` children. Among the `[data-hero-candidate]` elements it un-hides exactly one, chosen by the same rule as `featuredRelease`: nearest upcoming, else newest out. If a `#shows` list ends up empty, it hides the section and its nav link. The module calls `applyLiveDates(document, new Date())` on load.

- [ ] **Step 1: Write the failing tests** (build a small DOM fixture per test)

```ts
it('hides a show the day after its date, in Ljubljana time')
it('keeps a show visible at 23:59 Ljubljana on its date')
it('switches a release from upcoming to out on its date')
it('moves the hero to the next upcoming release when the featured one comes out')
it('hides the shows section and its nav link when every show is past')
it('is a no-op on markup without data attributes')
```

- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement.** It uses only the pure functions from `src/lib`, so the client and the build cannot disagree.
- [ ] **Step 4: Run** `npm test` - PASS. In `npm run preview`, temporarily change a seeded show to yesterday's date in the browser devtools and reload to confirm it's hidden.
- [ ] **Step 5: Commit** - `git commit -m "feat: hide past shows and switch releases on the day, client side"`

---

### Task 10: Press / Booking page

**Files:**
- Create: `src/pages/press.astro`, `src/components/PressKit.astro`
- Test: `tests/build/output.test.ts` (add cases)

**Interfaces:**
- Consumes: `loadSite`, `resolveMedia`, `url`, `Base.astro`, members collection.
- Page order: h1 "Press & Booking", long bio, members, press photos (grid, each with its caption, its credit when set, and a "Download" link to the original asset with the `download` attribute), "Full-resolution press kit" link (only when set), tech rider link via `url(techRider)` (only when set), booking email (`mailto:`) and phone (`tel:`, only when set). Header "Press" links here. The page has its own `og:title`/`description`.

- [ ] **Step 1: Write the failing tests**

```ts
it('press page lists every seeded press photo with a download link')
it('omits the full-resolution link and phone when they are empty')
it('links the tech rider under /icarus-down/files/')
it('every root-relative href/src in all pages starts with /icarus-down/')   // re-runs the Task 1 check over the full site
```

- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test && npm run build && npm run test:build` - PASS.
- [ ] **Step 5: Commit** - `git commit -m "feat: press and booking page"`

---

### Task 11: Accessibility and weight check

**Files:**
- Create: `.pa11yci.json` (urls `http://localhost:4321/icarus-down/` and `.../press/`, standard `WCAG2AA`, runners `axe` and `htmlcs`)
- Modify: `package.json` (`a11y` script: start `astro preview` with `start-server-and-test`, then run `pa11y-ci`), `.github/workflows/deploy.yml` (run `npm run a11y` after `test:build`)
- Test: `tests/build/output.test.ts` (add the weight case)

- [ ] **Step 1: Add the failing weight test:** `it('home page HTML + CSS + JS + images above the fold stay under 500 KB')`. It sums the sizes of `dist/index.html`, its CSS and JS, and the hero image.
- [ ] **Step 2: Run** `npm run build && npm run test:build && npm run a11y` and fix every reported issue (expect contrast, focus outline and link-name findings).
- [ ] **Step 3: Check by hand:** keyboard-only pass on both pages (skip link, visible focus, video button plays with Enter/Space), and VoiceOver or NVDA reading the shows list.
- [ ] **Step 4: Run again** - all PASS, with 0 pa11y errors.
- [ ] **Step 5: Commit** - `git commit -m "chore: accessibility and page-weight checks in CI"`

---

### Task 12: Go live and connect Pages CMS (with AlanOne)

AlanOne takes the account steps. The implementer guides him and verifies.

- [ ] **Step 1:** AlanOne creates the public repo `AlanOne/icarus-down` on GitHub. Push `main`.
- [ ] **Step 2:** In the repo settings, under Pages, set Source to "GitHub Actions". Confirm the workflow run is green and `https://alanone.github.io/icarus-down/` loads. Confirm `/takefive/` and `/undefined-behavior/` still load.
- [ ] **Step 3:** AlanOne signs in at app.pagescms.org with GitHub, installs the Pages CMS GitHub App on `icarus-down` only, and opens the repo. Confirm all five content entries and both media libraries appear.
- [ ] **Step 4: End-to-end check:** in Pages CMS, add a test show for tomorrow and save. Within about 2 minutes it's on the live site. Delete it and confirm it's gone.
- [ ] **Step 5:** Replace the seed content with the band's real content (AlanOne's assets), commit through Pages CMS, and review the live site on a phone.

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| Astro, GitHub Pages, Actions on every push | 1 |
| Lives at alanone.github.io/icarus-down/, single base value | 1, 10, 12 |
| Pages CMS editing | 5, 12 |
| Shows hide the day after, Ljubljana time, without a rebuild | 2, 7, 9 |
| Upcoming releases, pre-save, switch on release day, fallback "Listen" | 3, 8, 9 |
| Music: upcoming first, "Coming <date>" | 3, 8 |
| Empty sections hidden | 7, 9 |
| Click-to-play nocookie videos, link buttons for music, no cookies or analytics | 8 |
| Press page: bio, web-ready photos, full-res link, tech rider, booking | 4, 10 |
| Open Graph share image | 7 |
| Mobile-first, WCAG 2.2 AA, not heavy | 6, 7, 11 |
| Visual direction chosen by AlanOne | 6 |
| Public repo | 12 |
