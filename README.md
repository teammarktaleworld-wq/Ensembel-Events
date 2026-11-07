# Ensembel Events — homepage demo

A single-page demo of a new homepage for Ensembel Events (New Delhi, since 2008). It is media-first: their real event photos and videos fill the page, there is very little text, and click-driven category themes re-colour the whole site.

## Stack

- Astro 7 (TypeScript, static output) and Tailwind CSS v4
- GSAP (ScrollTrigger, SplitText) and Lenis smooth scroll, kept in sync through `gsap.ticker`
- OGL for the WebGL thread background
- Fonts: Inter Tight (headings) and Inter (body), self-hosted through `@fontsource-variable`

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
2. **Clients.** Key numbers and the 24 client logos from the current site.
3. **Services.** The 12 services in 4 expanding photo/video panels.
4. **Showreel.** 3 videos (Almora Festival 2019, Droom Auto Awards, Ensembel showreel). The tabs switch the screen with a circular wipe, and "Play with sound" opens the full video.
5. **Work gallery.** 33 photos and videos with category filters and a "Show all" button. Each one opens in a full-screen viewer with keyboard and swipe support.
6. **Process.** 6 steps.
7. **Contact.** A call-to-action card. "Send an enquiry" opens the form as a drawer.

Picking a category anywhere (hero chips, gallery filters, a service panel or a showreel tab) updates all of these together, including the colour of the background threads.

Political imagery on the current site, such as the conclave video and the politician photos, is deliberately left out. Two photos were cropped to remove phone-camera watermarks.

## Structure

```
src/
  data/site.ts            Copy: contact details, categories, wall line-ups, services, clients, process, budgets
  data/media.ts           Every photo and video: file, size, categories, caption, alt text
  layouts/Base.astro      <head>: SEO meta, Open Graph, LocalBusiness JSON-LD
  pages/index.astro       Section order
  components/             Backdrop, Header, Hero, Clients, Services, Showreel, Gallery,
                          Process, Contact, Footer, Lightbox, Enquiry, Tile
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

## Motion and accessibility

- With *prefers-reduced-motion* on, smooth scrolling, the wall animation and the WebGL threads are all off. Videos show still posters, and the visitor can start them with the "Play videos" button.
- The "Pause videos" button stops every background video on the page.
- The WebGL threads also skip low-end devices and browsers without WebGL, and show static curves instead.
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
- [ ] Stats: founded 2008, 12 services, 24+ brands
- [ ] Photo and video captions in `media.ts`. Some are general ("Conference", "Award night") because the current site does not name those events.
- [ ] Client logos are copied from the current website. Confirm each brand is happy to be shown.
- [ ] Rights to use the photos and videos (some look like phone or social-media uploads)
- [ ] Budget ranges in the enquiry form
- [ ] Logo: the site uses a 307×120 PNG taken from the current website. Supply a high-resolution or vector (SVG) version.
- [ ] Higher-resolution photos and videos. The videos are only 640px wide, so originals would look much sharper.
- [ ] Privacy policy page (the footer link is a placeholder)
- [ ] Contact email and phone number

