# Ensembel Events — homepage demo

A single-page demo of a new homepage for Ensembel Events (New Delhi, since 2008). It is media-first: their real event photos and videos fill the page, there is very little text, and click-driven category themes re-colour the whole site.

## Stack

- Astro 7 (TypeScript, static output) and Tailwind CSS v4
- GSAP (ScrollTrigger, SplitText) and Lenis smooth scroll, kept in sync through `gsap.ticker`
- OGL for the WebGL thread background
- three.js for the 3D wedding venue (loaded only as the Weddings section approaches)
- Fonts: Inter Tight (headings) and Inter (body), self-hosted through `@fontsource-variable`; Cormorant Garamond for the wedding accents

## Setup

Requires Node 22.23 or later.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve the built site
```

## What is on the page

The page uses Ensembel's own photos, videos and client logos from ensembelevents.com, with as little text as possible:

1. **Event wall (hero).** 8 photo and video tiles around the tagline "You dream. We make." They light up on load, and one photo swaps every few seconds. Category chips (Conferences, Awards & media, Launches & brand, Concerts & shows) flip the wall to that category's events and re-tint the whole page. Click any tile to open it full screen.
2. **Clients.** Key numbers (1000+ events delivered, founded 2008, 24+ brands, pan-India) and the 24 client logos from the current site.
3. **Services.** The 12 services in 4 expanding photo/video panels.
4. **Weddings.** "From boardrooms to baraats." A 3D palace courtyard and mandap that you move through as you scroll the wedding day. Each function opens like a page: the camera zooms into the mandap while a disc in the next function's colours grows over the screen with its title, then opens from the centre onto the re-dressed scene. Each function has its own scroll animation: turmeric clouds for Haldi, henna vines drawing themselves for Mehendi, fairy lights switching on and the couple dancing for Sangeet, the seven rounds with a counter for Pheras, and a grand entry down the aisle with cold-pyro fountains and a fireworks finale for Reception. The same mandap is re-dressed for each function — Haldi, Mehendi, Sangeet, Pheras, Reception — with its own drapes, flowers, coloured lights and time of day, from morning sun to a starlit night, and the section's colours (cards, menu, progress bar, colour wash) change with it. In the Pheras the bride and groom walk the seven rounds around the sacred fire and each vow appears on screen. Hotspot labels point out the décor. It is followed by an illustrated bride and groom who exchange varmalas and are tied by the gathbandhan as you scroll, with the wedding services and a "Plan your wedding" button.
5. **Showreel.** 3 videos (Almora Festival 2019, Droom Auto Awards, Ensembel showreel). The tabs switch the screen with a circular wipe, and "Play with sound" opens the full video.
6. **Work gallery.** 33 photos and videos with category filters and a "Show all" button. Each one opens in a full-screen viewer with keyboard and swipe support.
7. **Process.** 6 steps.
8. **Contact.** A call-to-action card. "Send an enquiry" opens the form as a drawer.

Picking a category anywhere (hero chips, gallery filters, a service panel or a showreel tab) updates all of these together, including the colour of the background threads.

Political imagery on the current site, such as the conclave video and the politician photos, is deliberately left out. Two photos were cropped to remove phone-camera watermarks.

## Structure

```
src/
  data/site.ts            Copy: contact details, categories, wall line-ups, services, clients, process, budgets
  data/media.ts           Every photo and video: file, size, categories, caption, alt text
  layouts/Base.astro      <head>: SEO meta, Open Graph, LocalBusiness JSON-LD
  pages/index.astro       Section order
  components/             Backdrop, Header, Hero, Clients, Services, Weddings, WeddingCouple,
                          Showreel, Gallery, Process, Contact, Footer, Lightbox, Enquiry, Tile
  scripts/
    main.ts               Entry point
    state.ts              Active category and scroll lock
    video.ts              Plays background videos only while they are on screen; pause button
    wall.ts               Hero wall: power-on animation, category flips, idle photo swaps
    gallery.ts            Gallery filters (GSAP Flip) and "Show all"
    sections.ts           Service panels and showreel tabs
    lightbox.ts           Full-screen photo/video viewer
    ui.ts                 Header, mobile menu, enquiry drawer, form validation
    animations.ts         Scroll-driven motion
    lenis.ts              Smooth scroll
    shader.ts             WebGL threads (loaded after first paint)
    wedding/              Weddings section: index.ts (scroll, cards, labels), couple.ts (varmala timeline),
                          scene.ts (three.js scene and camera path), mandap.ts, venue.ts, couple3d.ts,
                          effects.ts, themes.ts (the five functions' looks), textures.ts (painted in code)
  styles/global.css       Theme tokens and category colours
public/
  media/                  Photos (640px and 1280px WebP), video loops, full videos, posters
  clients/                Client logos
  images/                 Logo and og.jpg share image
```

### Editing content

- **Text:** `src/data/site.ts`.
- **Photos and videos:** add the files to `public/media/`, then add an entry to `src/data/media.ts`. Each entry needs categories (`conf`, `awards`, `launch`, `live`), a caption and alt text. To put an item on the hero wall, add its id to `wall` in `site.ts`.
- **Category colours:** the `html[data-cat=...]` rules in `src/styles/global.css`, plus `palette` in `src/scripts/state.ts` for the background threads.
- **Video weight:** the short muted loops are 0.4–1 MB each and play only while on screen. The full videos (4–7 MB) load only when someone presses play.

### Editing the Weddings section

- **Text:** `wedding` in `src/data/site.ts` holds each function's copy, the hotspot labels, the seven phera vows and the wedding services.
- **Looks per function:** `THEMES` in `src/scripts/wedding/themes.ts` (sky, light, drape and flower colours, lamps, fairy lights).
- **Camera path:** `KEYS` in `src/scripts/wedding/scene.ts`.
- **Page colours per function:** `PALETTE` in `src/scripts/wedding/chapters.ts` (also used by the illustrated poster).
- Every texture is painted in code, so the 3D scene ships no image files. three.js (about 165 KB gzipped) loads only when the section comes near.
- The renderer is kept light on purpose (no post-processing, capped resolution, small shadow map). If the browser drops the WebGL context, the scene restarts once in a lighter mode; if that also fails, the illustrated poster stays, still changing colour per function.

## Motion and accessibility

- If the page script is slow to start (over 10 seconds, e.g. a cold dev server over a slow link), the page first shows without motion and switches motion on as soon as the script runs.
- With *prefers-reduced-motion* on, smooth scrolling, the wall animation and the WebGL threads are all off. Videos show still posters, and the visitor can start them with the "Play videos" button.
- The "Pause videos" button stops every background video on the page.
- The WebGL threads also skip low-end devices and browsers without WebGL, and show static curves instead.
- Weddings: with reduced motion the 3D scene shows one still frame, the five functions are listed as cards and the tabs switch the scene; without WebGL an illustrated poster is shown. Phones and lower-powered devices get a lighter scene (no shadows or bloom, fewer flowers). Rendering pauses whenever the section is off screen.
- The viewer and the enquiry drawer keep keyboard focus inside them, close with Esc, and return focus to the button that opened them.
- Also included: a skip link, visible focus rings, labelled form fields with inline errors, and alt text on every gallery photo.

## Enquiry form

The form runs in demo mode. It validates name, phone and email, has a hidden honeypot field against spam, and shows *"Thank you. We'll respond within one working day."* on success. It opens as a drawer from any "Plan your event" or "Send an enquiry" button. To connect the PHP backend, see the comment `PHP endpoint will connect here` in `src/scripts/ui.ts`.

## Deploy to Vercel

1. Push this folder to a Git repository, or run `npx vercel` from inside it.
2. In Vercel, import the project. It detects Astro automatically, so no extra configuration is needed:
   - build command: `npm run build`
   - output directory: `dist`
3. Deploy.

During a Vercel build, the share image and `og:url` point at the deployment's own production URL, so link previews of the demo work. Otherwise they point at www.ensembelevents.com. The canonical URL always points at www.ensembelevents.com.

## CLIENT TO VERIFY before going live

- [ ] Office street address (`site.ts`, currently "D-3, 3rd Floor, Chhatarpur, New Delhi 110074")
- [ ] Social profile URLs (all four are `#` placeholders)
- [ ] Stats: 1000+ events delivered, founded 2008, 24+ brands
- [ ] Wedding services list and copy in `site.ts` (`wedding`), and whether destination weddings are offered
- [ ] Real wedding photos and videos: the Weddings section is fully illustrated (3D and SVG) because the current site has no wedding imagery
- [ ] Photo and video captions in `media.ts`. Some are general ("Conference", "Award night") because the current site does not name those events.
- [ ] Client logos are copied from the current website. Confirm each brand is happy to be shown.
- [ ] Rights to use the photos and videos (some look like phone or social-media uploads)
- [ ] Budget ranges in the enquiry form
- [ ] Logo: the site uses a 307×120 PNG taken from the current website. Supply a high-resolution or vector (SVG) version.
- [ ] Higher-resolution photos and videos. The videos are only 640px wide, so originals would look much sharper.
- [ ] Privacy policy page (the footer link is a placeholder)
- [ ] Contact email and phone number

