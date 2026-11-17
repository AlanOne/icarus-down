# Icarus Down website - design

Date: 2026-11-17
Status: draft, waiting for approval

## Intent

Icarus Down needs one place on the web where fans, venues and promoters can find the band. Fans should learn who the band is, where to listen, what to watch and when the next show is. Venues and promoters should get a single link with everything they need to book the band.

AlanOne is the only person who updates the site. He wants it cheap, low-maintenance and editable without touching code.

## Goals

- Fans can see who the band is, listen to the music, watch the videos and find upcoming shows.
- Venues and promoters get one shareable Press / Booking page with a bio, downloadable press photos, a tech rider and a booking contact.
- AlanOne edits all content in a friendly web editor (Pages CMS), and changes go live within a couple of minutes.
- The site is in English only.

## Non-goals

- Shared tools for bandmates (gig or setlist manager). That is a separate project.
- A merch shop, mailing list, blog or news section. These can be added later.
- A Slovenian version.
- Hosting audio files. Music is reached through links to streaming services.

## Anti-goals (what would make it a failure even if it works)

- The site looks out of date: past shows still listed, or empty sections with nothing in them.
- It needs ongoing upkeep: plugins to update, a server to patch, monthly fees.
- It looks like a generic template.
- It is slow or heavy on a phone.

## Constraints

- Free hosting. The only possible cost is a custom domain, which is optional.
- Code and content live on GitHub, which AlanOne already uses.
- AlanOne previews locally on a Windows PC.
- Single editor, so a GitHub sign-in for the CMS is fine.

## Approaches

All three use Pages CMS and free hosting on GitHub Pages.

1. **Astro static site (chosen).** Content lives as small Markdown/YAML files in the repo. Astro builds them into plain HTML, and a GitHub Action rebuilds and deploys on every save. Search engines and link previews see the real content. Pages CMS supports it well. The build step runs on GitHub, so AlanOne never deals with it.
2. **Plain HTML plus one data file, rendered in the browser.** No build step. Simplest on day one, but gets messy as the Press page and more sections are added, and search engines and link previews see less of the content. Rejected.
3. **Jekyll.** Built into GitHub Pages, so the least setup on GitHub. Older tooling, and local preview on Windows needs Ruby, which is fiddly. Rejected.

Also considered and rejected earlier in the conversation: hosted site builders (Google Sites, Wix, Squarespace), because there is a single technical editor and the goal is a custom look with no lock-in or monthly fee. WordPress, because of hosting and security upkeep.

AlanOne picked approach 1.

## Decided with AlanOne

- Astro site in a GitHub repo on AlanOne's account, deployed to GitHub Pages by GitHub Actions on every push.
- It lives beside his existing GitHub Pages projects (Take 5 and undefined-behavior) under `alanone.github.io`.
- Pages CMS as the content editor.
- English only.
- Audience: fans plus venues and promoters.
- Content: band info, music and where to listen, videos, upcoming shows.

## Structure and content (Claude's proposal, accepted in conversation)

**Home** - one scrolling page:
1. Header with band name and anchor links (Music, Videos, Shows, About, Press).
2. Hero: band photo, latest release, and "listen" buttons for that release.
3. Upcoming shows.
4. Music: releases, each linking to where to listen.
5. Videos.
6. About: short bio and members.
7. Footer: social links and booking email.

**Press / Booking** - a separate page: long bio, downloadable high-resolution press photos, tech rider / stage plot (PDF), booking contact.

**Content types editable in Pages CMS:**

| Type | Fields |
|------|--------|
| Show | date, venue, city, country (optional), ticket link (optional), note (optional, e.g. "support for X", "free entry") |
| Release | title, type (single / EP / album), release date, cover image, pre-save link (optional), links (Spotify, Bandcamp, Apple Music, YouTube Music, other, all optional) |
| Video | title, YouTube URL, date |
| Member | name, role or instrument, photo (optional), order |
| Band info | short bio (home), long bio (press), hero photo |
| Press kit | press photos (web-ready, see below), full-resolution press kit link (optional), tech rider PDF, booking email, booking phone (optional) |
| Site settings | social links (Instagram, Facebook, YouTube, Spotify, Bandcamp, TikTok, other), share image for link previews |

**Behavior:**
- **Upcoming releases (decided with AlanOne).** A release can be added before it comes out. A release whose date is in the future is "upcoming".
  - Hero: if there is an upcoming release, the nearest one is featured with "Out <date>" and a Pre-save button. Otherwise the newest released one is featured with its listen buttons.
  - On release day (Europe/Ljubljana time) the switch from "Out <date> / Pre-save" to the listen buttons happens in the browser, with no rebuild needed, the same way past shows disappear.
  - If a release has no listen links yet on release day, its pre-save link is shown as "Listen" instead, since pre-save services usually redirect to the release once it's out (Claude's call).
  - In the Music section, upcoming releases appear first, marked "Coming <date>".
- Past shows are filtered out at build time, and also hidden in the browser once their date has passed, so they disappear on time without a rebuild.
- Any section with no content is hidden.

## Claude's calls (correct any of these)

- A show disappears the day after its date, in Europe/Ljubljana time.
- Videos load "click to play": a thumbnail first, the YouTube player (youtube-nocookie) only after a click. This keeps the page fast and avoids YouTube cookies before consent, so no cookie banner is needed.
- Music is linked with buttons, not embedded players, for the same speed and cookie reasons.
- The repo is public, like AlanOne's other GitHub Pages projects, so hosting stays free. Everything in it ends up on the public site anyway. The booking phone stays optional, because old values remain visible in the repo history.
- Press photos: a handful (up to about 10) of web-ready press photos, each about 3000 px on the long edge and a few MB at most, stored in the repo and downloadable from the Press page. Full-resolution originals do not go in the repo. An optional "Full-resolution press kit" link field points to an external folder or zip (Google Drive, Dropbox or similar). This keeps the repo small, because replaced files stay in its history.
- No analytics at launch. Privacy-friendly analytics can be added later.
- Mobile-first layout, WCAG 2.2 AA accessibility.
- Open Graph / social share image so the link looks good when pasted into email, WhatsApp or social media.
- Repo name: `icarus-down`.
- The site lives beside AlanOne's other GitHub Pages projects (`alanone.github.io/takefive/`, `alanone.github.io/undefined-behavior/`) at `https://alanone.github.io/icarus-down/`. Astro's `site` and `base` settings must match that sub-path, and all internal links and asset paths must respect `base`. If a custom domain is added later, `base` becomes `/`, so keep it in one config value.

## Still open (settle at the start of the build)

- **Visual direction.** The look and feel is AlanOne's to choose. Settle it with a few mockups before building the pages.
- **Content and assets from AlanOne:** logo (if any), band and press photos, bio, releases with their links, videos, upcoming shows, tech rider, booking email, social links.
- **Domain:** whether to buy one. Not blocking.

## Left to the builder

Component structure, CSS approach, image optimization (Astro's built-in tools are fine), the exact `.pages.yml` configuration, the GitHub Actions workflow, and seed or placeholder content for development.
