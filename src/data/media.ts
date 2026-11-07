// Generated from the client's website photos and videos. Political imagery is deliberately excluded.
export type Category = 'all' | 'conf' | 'awards' | 'launch' | 'live';

export type MediaItem = {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumb: string;
  full?: string;
  w: number;
  h: number;
  cats: Exclude<Category, 'all'>[];
  caption: string;
  alt: string;
};

export const media: MediaItem[] = [
  {
    "id": "awards-stage",
    "type": "image",
    "src": "/media/awards-stage-1280.webp",
    "thumb": "/media/awards-stage-640.webp",
    "w": 1280,
    "h": 861,
    "cats": [
      "awards"
    ],
    "caption": "India Today Art Awards",
    "alt": "Stage and reserved seating at the India Today Art Awards"
  },
  {
    "id": "droom-gateway",
    "type": "image",
    "src": "/media/droom-gateway-1280.webp",
    "thumb": "/media/droom-gateway-640.webp",
    "w": 1280,
    "h": 854,
    "cats": [
      "awards",
      "live"
    ],
    "caption": "Droom Pre-owned Auto Awards",
    "alt": "Lit truss gateway with the Droom logo at the auto awards"
  },
  {
    "id": "concert",
    "type": "image",
    "src": "/media/concert-1280.webp",
    "thumb": "/media/concert-640.webp",
    "w": 1280,
    "h": 854,
    "cats": [
      "live"
    ],
    "caption": "Live concert",
    "alt": "Two performers on a lit stage with confetti"
  },
  {
    "id": "track-day",
    "type": "image",
    "src": "/media/track-day-1280.webp",
    "thumb": "/media/track-day-640.webp",
    "w": 1280,
    "h": 862,
    "cats": [
      "launch"
    ],
    "caption": "Droom Track Day",
    "alt": "Riders and guests with motorcycles at the Droom Track Day"
  },
  {
    "id": "coke-conference",
    "type": "image",
    "src": "/media/coke-conference-1280.webp",
    "thumb": "/media/coke-conference-640.webp",
    "w": 768,
    "h": 576,
    "cats": [
      "conf"
    ],
    "caption": "Coca-Cola Annual Meet",
    "alt": "Delegates in a ballroom facing stage screens"
  },
  {
    "id": "coke-gala",
    "type": "image",
    "src": "/media/coke-gala-1280.webp",
    "thumb": "/media/coke-gala-640.webp",
    "w": 768,
    "h": 576,
    "cats": [
      "conf",
      "live"
    ],
    "caption": "Coca-Cola Annual Meet",
    "alt": "Gala dinner set-up under moving stage lights"
  },
  {
    "id": "coke-tunnel",
    "type": "image",
    "src": "/media/coke-tunnel-1280.webp",
    "thumb": "/media/coke-tunnel-640.webp",
    "w": 768,
    "h": 576,
    "cats": [
      "launch"
    ],
    "caption": "Coca-Cola Annual Meet",
    "alt": "LED tunnel entrance with a red carpet"
  },
  {
    "id": "aabhar-stage",
    "type": "image",
    "src": "/media/aabhar-stage-1280.webp",
    "thumb": "/media/aabhar-stage-640.webp",
    "w": 768,
    "h": 432,
    "cats": [
      "launch"
    ],
    "caption": "Aabhar Partner Appreciation",
    "alt": "Stage with a painted peacock backdrop"
  },
  {
    "id": "aabhar-letters",
    "type": "image",
    "src": "/media/aabhar-letters-1280.webp",
    "thumb": "/media/aabhar-letters-640.webp",
    "w": 768,
    "h": 432,
    "cats": [
      "launch"
    ],
    "caption": "Aabhar Partner Appreciation",
    "alt": "Giant hand-painted letter installation"
  },
  {
    "id": "vertiv-udaan",
    "type": "image",
    "src": "/media/vertiv-udaan-1280.webp",
    "thumb": "/media/vertiv-udaan-640.webp",
    "w": 768,
    "h": 576,
    "cats": [
      "conf"
    ],
    "caption": "Vertiv Udaan",
    "alt": "Red-themed ballroom stage for the Vertiv Udaan meet"
  },
  {
    "id": "theme-entrance",
    "type": "image",
    "src": "/media/theme-entrance-1280.webp",
    "thumb": "/media/theme-entrance-640.webp",
    "w": 768,
    "h": 576,
    "cats": [
      "launch"
    ],
    "caption": "Theme décor",
    "alt": "Traditional umbrella and ornament décor at a venue entrance"
  },
  {
    "id": "evening-tent",
    "type": "image",
    "src": "/media/evening-tent-1280.webp",
    "thumb": "/media/evening-tent-640.webp",
    "w": 768,
    "h": 495,
    "cats": [
      "live"
    ],
    "caption": "Evening programme",
    "alt": "Guests seated under a lit marquee tent"
  },
  {
    "id": "fintech-summit",
    "type": "image",
    "src": "/media/fintech-summit-1280.webp",
    "thumb": "/media/fintech-summit-640.webp",
    "w": 1024,
    "h": 680,
    "cats": [
      "conf"
    ],
    "caption": "Mint Fintech Summit 2016",
    "alt": "Panel discussion on stage at the Mint Fintech Summit"
  },
  {
    "id": "healthcare-conclave",
    "type": "image",
    "src": "/media/healthcare-conclave-1280.webp",
    "thumb": "/media/healthcare-conclave-640.webp",
    "w": 1032,
    "h": 774,
    "cats": [
      "conf"
    ],
    "caption": "Healthcare conclave",
    "alt": "Audience facing a panel at a healthcare conclave"
  },
  {
    "id": "ballroom-conference",
    "type": "image",
    "src": "/media/ballroom-conference-1280.webp",
    "thumb": "/media/ballroom-conference-640.webp",
    "w": 1280,
    "h": 720,
    "cats": [
      "conf"
    ],
    "caption": "Corporate conference",
    "alt": "Ballroom set for a corporate conference with stage screens"
  },
  {
    "id": "conference-hall",
    "type": "image",
    "src": "/media/conference-hall-1280.webp",
    "thumb": "/media/conference-hall-640.webp",
    "w": 1280,
    "h": 853,
    "cats": [
      "conf"
    ],
    "caption": "Conference",
    "alt": "Audience seated before a blue conference stage"
  },
  {
    "id": "conference-stage",
    "type": "image",
    "src": "/media/conference-stage-1280.webp",
    "thumb": "/media/conference-stage-640.webp",
    "w": 1280,
    "h": 853,
    "cats": [
      "conf"
    ],
    "caption": "Conference",
    "alt": "Speaker at a podium beside a panel on a blue stage"
  },
  {
    "id": "boardroom",
    "type": "image",
    "src": "/media/boardroom-1280.webp",
    "thumb": "/media/boardroom-640.webp",
    "w": 1040,
    "h": 585,
    "cats": [
      "conf"
    ],
    "caption": "Boardroom meeting",
    "alt": "Boardroom-style seating set for a corporate meeting"
  },
  {
    "id": "award-night",
    "type": "image",
    "src": "/media/award-night-1280.webp",
    "thumb": "/media/award-night-640.webp",
    "w": 1280,
    "h": 853,
    "cats": [
      "awards"
    ],
    "caption": "Award night",
    "alt": "Award stage with statues and a lit centrepiece"
  },
  {
    "id": "award-presenters",
    "type": "image",
    "src": "/media/award-presenters-1280.webp",
    "thumb": "/media/award-presenters-640.webp",
    "w": 1280,
    "h": 853,
    "cats": [
      "awards"
    ],
    "caption": "Award night",
    "alt": "Presenters on an award-show stage"
  },
  {
    "id": "art-awards-decor",
    "type": "image",
    "src": "/media/art-awards-decor-1280.webp",
    "thumb": "/media/art-awards-decor-640.webp",
    "w": 960,
    "h": 540,
    "cats": [
      "awards"
    ],
    "caption": "India Today Art Awards",
    "alt": "Table décor at the India Today Art Awards"
  },
  {
    "id": "cybermedia",
    "type": "image",
    "src": "/media/cybermedia-1280.webp",
    "thumb": "/media/cybermedia-640.webp",
    "w": 1032,
    "h": 581,
    "cats": [
      "conf"
    ],
    "caption": "CyberMedia",
    "alt": "Lit stage with CyberMedia branding"
  },
  {
    "id": "shopclues-induction",
    "type": "image",
    "src": "/media/shopclues-induction-1280.webp",
    "thumb": "/media/shopclues-induction-640.webp",
    "w": 1280,
    "h": 960,
    "cats": [
      "launch"
    ],
    "caption": "ShopClues",
    "alt": "Stage for a ShopClues engineering induction programme"
  },
  {
    "id": "shopclues-edge",
    "type": "image",
    "src": "/media/shopclues-edge-1280.webp",
    "thumb": "/media/shopclues-edge-640.webp",
    "w": 1280,
    "h": 720,
    "cats": [
      "conf"
    ],
    "caption": "ShopClues Business Edge",
    "alt": "Banquet hall set for ShopClues Business Edge"
  },
  {
    "id": "team-launch",
    "type": "image",
    "src": "/media/team-launch-1280.webp",
    "thumb": "/media/team-launch-640.webp",
    "w": 1280,
    "h": 720,
    "cats": [
      "launch"
    ],
    "caption": "Product launch",
    "alt": "Team on stage at a product launch"
  },
  {
    "id": "droom-stage",
    "type": "image",
    "src": "/media/droom-stage-1280.webp",
    "thumb": "/media/droom-stage-640.webp",
    "w": 1280,
    "h": 720,
    "cats": [
      "launch",
      "live"
    ],
    "caption": "Droom",
    "alt": "Night stage with a large screen at a Droom event"
  },
  {
    "id": "droom-presenters",
    "type": "image",
    "src": "/media/droom-presenters-1280.webp",
    "thumb": "/media/droom-presenters-640.webp",
    "w": 1280,
    "h": 720,
    "cats": [
      "awards"
    ],
    "caption": "Droom Pre-owned Auto Awards",
    "alt": "Presenters on stage at the Droom auto awards"
  },
  {
    "id": "droom-crowd",
    "type": "image",
    "src": "/media/droom-crowd-1280.webp",
    "thumb": "/media/droom-crowd-640.webp",
    "w": 1280,
    "h": 720,
    "cats": [
      "live"
    ],
    "caption": "Droom Pre-owned Auto Awards",
    "alt": "Crowd facing a lit night stage"
  },
  {
    "id": "brand-display",
    "type": "image",
    "src": "/media/brand-display-1280.webp",
    "thumb": "/media/brand-display-640.webp",
    "w": 960,
    "h": 540,
    "cats": [
      "launch"
    ],
    "caption": "Brand experience",
    "alt": "Product display zone with screens at a corporate event"
  },
  {
    "id": "aajtak-sign",
    "type": "image",
    "src": "/media/aajtak-sign-1280.webp",
    "thumb": "/media/aajtak-sign-640.webp",
    "w": 1280,
    "h": 604,
    "cats": [
      "awards"
    ],
    "caption": "Aaj Tak",
    "alt": "Illuminated #1 Aaj Tak sign at a media event"
  },
  {
    "id": "almora-a",
    "type": "video",
    "src": "/media/almora-a.mp4",
    "full": "/media/almora-full.mp4",
    "thumb": "/media/almora-a-poster.webp",
    "w": 640,
    "h": 262,
    "cats": [
      "live"
    ],
    "caption": "Almora Festival 2019",
    "alt": "Concert stage with truss lighting and smoke at the Almora Festival"
  },
  {
    "id": "almora-b",
    "type": "video",
    "src": "/media/almora-b.mp4",
    "full": "/media/almora-full.mp4",
    "thumb": "/media/almora-b-poster.webp",
    "w": 640,
    "h": 262,
    "cats": [
      "live"
    ],
    "caption": "Almora Festival 2019",
    "alt": "Band performing in green light at the Almora Festival"
  },
  {
    "id": "almora-c",
    "type": "video",
    "src": "/media/almora-c.mp4",
    "full": "/media/almora-full.mp4",
    "thumb": "/media/almora-c-poster.webp",
    "w": 640,
    "h": 262,
    "cats": [
      "live"
    ],
    "caption": "Almora Festival 2019",
    "alt": "Wide view of the Almora Festival stage and crowd"
  },
  {
    "id": "droom-band",
    "type": "video",
    "src": "/media/droom-band.mp4",
    "full": "/media/droom-band-full.mp4",
    "thumb": "/media/droom-band-poster.webp",
    "w": 640,
    "h": 352,
    "cats": [
      "awards",
      "live"
    ],
    "caption": "Droom Pre-owned Auto Awards",
    "alt": "Live band at the Droom auto awards"
  },
  {
    "id": "showreel-loop",
    "type": "video",
    "src": "/media/showreel-loop.mp4",
    "full": "/media/showreel-full.mp4",
    "thumb": "/media/showreel-loop-poster.webp",
    "w": 640,
    "h": 352,
    "cats": [
      "conf"
    ],
    "caption": "Ensembel showreel",
    "alt": "Conference stage from the Ensembel Events showreel"
  }
];

export const byId = Object.fromEntries(media.map((m) => [m.id, m])) as Record<string, MediaItem>;
