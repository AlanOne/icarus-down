# Content fixtures

Each folder is a stand-in for `src/content/` plus `src/data/site.json`. Build the site
against one and run the build tests on it with:

    npm run test:fixture -- tests/fixtures/<name>

`empty/` is the bare minimum Pages CMS can leave behind: no shows, releases, videos or
members, no bios, no press photos, no tech rider, no social links. The build and every
build test must still pass on it, so CI never blocks a deploy just because a section has
nothing in it today.
