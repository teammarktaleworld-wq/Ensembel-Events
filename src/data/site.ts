import type { Category } from './media';

// All page copy lives here so it can be edited without touching components.

export const site = {
  name: 'Ensembel Events',
  url: 'https://www.ensembelevents.com',
  title: 'Ensembel Events — Corporate, Government & Wedding Event Management, New Delhi',
  description:
    'Ensembel Events plans and produces corporate conferences, award shows, product launches, concerts, government events and weddings across India. 1000+ events, New Delhi, since 2008.',
  tagline: 'You dream. We make.',
  phone: '+91 98111 14797',
  phoneHref: 'tel:+919811114797',
  whatsapp: 'https://wa.me/919811114797?text=' + encodeURIComponent("Hi, I'd like to plan an event"),
  email: 'sanjaykaran@ensembelevents.com',
  // CLIENT TO VERIFY street address
  address: { street: 'D-3, 3rd Floor, Chhatarpur', city: 'New Delhi', postcode: '110074', country: 'IN' },
  founded: 2008,
};

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Weddings', href: '#weddings' },
  { label: 'Showreel', href: '#showreel' },
  { label: 'Clients', href: '#clients' },
  { label: 'Contact', href: '#contact' },
];

// Each category re-tints the page when chosen.
export const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All events' },
  { id: 'conf', label: 'Conferences' },
  { id: 'awards', label: 'Awards & media' },
  { id: 'launch', label: 'Launches & brand' },
  { id: 'live', label: 'Concerts & shows' },
];

// Eight wall slots per category (media ids from media.ts).
export const wall: Record<Category, string[]> = {
  all: ['almora-b', 'awards-stage', 'coke-conference', 'track-day', 'droom-band', 'coke-tunnel', 'fintech-summit', 'concert'],
  conf: ['coke-conference', 'fintech-summit', 'showreel-loop', 'vertiv-udaan', 'healthcare-conclave', 'conference-stage', 'ballroom-conference', 'boardroom'],
  awards: ['awards-stage', 'droom-band', 'award-night', 'droom-gateway', 'award-presenters', 'art-awards-decor', 'droom-presenters', 'aajtak-sign'],
  launch: ['track-day', 'coke-tunnel', 'aabhar-letters', 'team-launch', 'aabhar-stage', 'shopclues-induction', 'droom-stage', 'brand-display'],
  live: ['almora-a', 'concert', 'almora-b', 'droom-band', 'evening-tent', 'droom-crowd', 'almora-c', 'coke-gala'],
};

export const stats = [
  { value: 1000, prefix: '', suffix: '+', label: 'Events delivered', count: true },
  { value: 2008, prefix: '', suffix: '', label: 'Founded', count: false },
  { value: 24, prefix: '', suffix: '+', label: 'Brands served', count: true },
  { value: 0, prefix: '', suffix: '', label: 'Pan-India delivery', count: false, text: 'India' },
];

export const clients = [
  { name: 'India Today Group', src: '/clients/india-today-group.webp', w: 115, h: 110 },
  { name: 'NDTV 24x7', src: '/clients/ndtv-24x7.webp', w: 184, h: 83 },
  { name: 'Network18', src: '/clients/network18.webp', w: 300, h: 72 },
  { name: 'TV9 Bharatvarsh', src: '/clients/tv9-bharatvarsh.webp', w: 196, h: 110 },
  { name: 'The Times of India', src: '/clients/the-times-of-india.webp', w: 279, h: 110 },
  { name: 'Droom', src: '/clients/droom.webp', w: 157, h: 110 },
  { name: 'BenQ', src: '/clients/benq.webp', w: 300, h: 96 },
  { name: 'ETV', src: '/clients/etv.webp', w: 137, h: 110 },
  { name: 'Red FM 93.5', src: '/clients/red-fm-93-5.webp', w: 204, h: 110 },
  { name: 'HSBC', src: '/clients/hsbc.webp', w: 282, h: 85 },
  { name: 'ShopClues', src: '/clients/shopclues.webp', w: 256, h: 81 },
  { name: 'Piramal', src: '/clients/piramal.webp', w: 187, h: 110 },
  { name: 'Donaldson', src: '/clients/donaldson.webp', w: 181, h: 107 },
  { name: 'Cox & Kings', src: '/clients/cox-kings.webp', w: 176, h: 110 },
  { name: 'Elets', src: '/clients/elets.webp', w: 167, h: 65 },
  { name: 'PPS Motors', src: '/clients/pps-motors.webp', w: 156, h: 91 },
  { name: 'cult.fit', src: '/clients/cult-fit.webp', w: 213, h: 88 },
  { name: 'HDFC Bank', src: '/clients/hdfc-bank.webp', w: 300, h: 61 },
  { name: 'CyberMedia', src: '/clients/cybermedia.webp', w: 204, h: 110 },
  { name: 'Mint', src: '/clients/mint.webp', w: 204, h: 83 },
  { name: 'CloudWalker', src: '/clients/cloudwalker.webp', w: 196, h: 110 },
  { name: 'Apollo Hospitals', src: '/clients/apollo-hospitals.webp', w: 252, h: 79 },
  { name: 'Sun Pharma', src: '/clients/sun-pharma.webp', w: 230, h: 97 },
  { name: 'Relaxo', src: '/clients/relaxo.webp', w: 185, h: 110 },
];

// The client's 12 services (plus government events), grouped into four panels.
export const serviceGroups: { title: string; cat: Exclude<Category, 'all'>; media: string; items: string[] }[] = [
  { title: 'Corporate & Government', cat: 'conf', media: 'coke-conference', items: ['Corporate events', 'Conferences', 'Trade & dealer meets', 'Government & institutional events', 'Corporate gifting'] },
  { title: 'Media & Awards', cat: 'awards', media: 'awards-stage', items: ['Award shows', 'Press meets', 'Media conclaves'] },
  { title: 'Launches & Activations', cat: 'launch', media: 'track-day', items: ['Product launches', 'Road shows', 'Retail & branding'] },
  { title: 'Concerts & Experiences', cat: 'live', media: 'almora-b', items: ['Concerts & festivals', 'Theme parties', 'Gaming competitions'] },
];

export const wedding = {
  eventTypes: ['Wedding', 'Destination wedding', 'Haldi, mehendi & sangeet', 'Reception'],
  whatsapp: 'https://wa.me/919811114797?text=' + encodeURIComponent("Hi, I'd like to plan a wedding"),
  // One mandap, re-dressed for every function. Labels point at parts of the 3D scene.
  chapters: [
    {
      id: 'haldi', time: 'Morning', title: 'Haldi', mood: 'Turmeric, marigold and the first dhol of the day',
      text: 'Turmeric, sunshine-yellow drapes and marigold strings, with the dhol going from the first knock on the door.',
      items: ['Marigold décor', 'Dhol & baaja', 'Haldi rituals'],
      labels: [{ anchor: 'lari', text: 'Fresh marigold laris' }, { anchor: 'kalash', text: 'Kalash & mango leaves' }],
    },
    {
      id: 'mehendi', time: 'Afternoon', title: 'Mehendi', mood: 'Parrot green, rani pink and henna on every hand',
      text: 'Parrot green and rani pink, mehendi artists for every hand, swings, music and live chaat counters.',
      items: ['Mehendi artists', 'Themed décor', 'Live counters'],
      labels: [{ anchor: 'canopy', text: 'Draped fabric canopy' }, { anchor: 'pillarFront', text: 'Marigold-wrapped pillars' }],
    },
    {
      id: 'sangeet', time: 'Evening', title: 'Sangeet', mood: 'Lights, music and both families on the dance floor',
      text: 'A stage, sound and lights for both families, choreography for the cousins, and a palace lit up after sunset.',
      items: ['Stage & sound', 'Choreography', 'Live performers'],
      labels: [{ anchor: 'fairy', text: 'Fairy-light canopy' }, { anchor: 'samai', text: 'Brass samai lamps' }],
    },
    {
      id: 'pheras', time: 'Twilight', title: 'Pheras', mood: 'Seven rounds around the sacred fire',
      text: 'The mandap, the pandit ji and seven rounds around the sacred fire, tied together by the gathbandhan.',
      items: ['Mandap design', 'Rituals & samagri', 'Phoolon ki chadar'],
      labels: [{ anchor: 'agni', text: 'Agni kund' }, { anchor: 'rangoli', text: 'Flower rangoli' }],
    },
    {
      id: 'reception', time: 'Night', title: 'Reception', mood: 'Ivory, gold and a grand entry under the fireworks',
      text: 'Ivory and gold under a crystal chandelier, a grand entry for the couple and dinner for every guest.',
      items: ['Grand entry', 'Lighting design', 'Guest hospitality'],
      labels: [{ anchor: 'chandelier', text: 'Crystal chandelier' }, { anchor: 'dome', text: 'Chhatri dome & kalash' }],
    },
  ],
  vows: [
    'Food and nourishment for their home',
    'Strength of body, mind and spirit',
    'Prosperity, earned together',
    'Love and respect for both families',
    'Children and a happy home',
    'Health and a long life together',
    'Friendship, for life',
  ],
  services: [
    'Wedding planning', 'Venues & destination weddings', 'Mandap & décor', 'Haldi & mehendi', 'Sangeet & entertainment', 'Baraat',
    'Guest travel & hospitality', 'Catering management', 'Photography & film', 'Reception',
  ],
};

export const eventTypes = [...serviceGroups.flatMap((g) => g.items), ...wedding.eventTypes];

// Showreel tabs: loop id plays inline, the full video (with sound) opens on demand.
export const reels = [
  { id: 'almora-b', title: 'Almora Festival 2019', cat: 'live' as const },
  { id: 'droom-band', title: 'Droom Auto Awards', cat: 'awards' as const },
  { id: 'showreel-loop', title: 'Ensembel showreel', cat: 'conf' as const },
];

export const process = ['Discover', 'Define', 'Design', 'Develop', 'Deploy', 'Deliver'];

export const budgets = ['Under ₹5 lakh', '₹5–15 lakh', '₹15–50 lakh', '₹50 lakh – ₹1 crore', 'Above ₹1 crore', 'Not sure yet'];

// CLIENT TO SUPPLY: social profile URLs
export const social = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'X', href: '#' },
];
