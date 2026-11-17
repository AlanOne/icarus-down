# Visual direction

Chosen by AlanOne on 2026-11-17: **mockup A, "Stage wash"** (`docs/mockups/a-stage-wash.html`).

- **Idea:** the site looks like the room at a show. A full-bleed live photo opens the page, and the palette is taken from the stage lighting in the 2026 MC ZoS Zagorje photos.
- **Colors:** blue night `#040b16` background (not grey-black), off-white text `#eef4fb`, muted `#a8b8cc`. Teal wash `#3ccbd9` is the one action color (buttons, links, focus ring). Violet beam `#9b7bff` is used only for section headings. All pairs meet 4.5:1 (checked in `tests/unit/tokens.test.ts`).
- **Type:** Big Shoulders Display (500, 800) for the band name, headings and show dates; Atkinson Hyperlegible (400, 700) for text. Both are self-hosted through `@fontsource`, so no request goes to Google.
- **Band name:** set in lowercase at hero size, like the logo's wordmark. The logo itself sits small in the header, as a white-on-transparent version of `logo.png`.
- **Photos:** the hero photo is full-bleed with a gradient into the background color at the bottom so the text stays readable. Other photos are shown as they are, square corners.
- **Shape:** square everything, except pill-shaped buttons.
- **Shows:** a ruled list with big condensed day numbers, then weekday and month, so a date is readable at a glance.
