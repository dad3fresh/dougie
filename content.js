/*
 * content.js — the ONLY file you edit as the trip goes on.
 * It sets window.CONTENT, which index.html reads on load.
 *
 * To add a daily selfie: copy a block in `drops` to the top, change the
 * fields, and (optionally) point `image` at a photo. Same idea for `wall`.
 * Leave `image` as "" to show a labelled placeholder tile instead.
 *
 * `image` can be a URL (https://…) or a path relative to this folder
 * (e.g. "photos/wat-arun.jpg"). Drop your photos in a /photos folder.
 */
window.CONTENT = {
  // ── Status / config ──────────────────────────────────────────────
  config: {
    isLive: true,                                   // true → pink "LIVE IN ASIA" badge, false → amber "ON THE MOVE"
    currentLocation: "Bangkok, Thailand",           // shown in the hero location chip
    qrTarget: "https://www.instagram.com/dug3fresh/" // URL the QR code points at
  },

  // ── Social links ─────────────────────────────────────────────────
  socials: {
    facebook:  "https://www.facebook.com/dug3fresh",
    instagram: "https://www.instagram.com/dug3fresh/",
    youtube:   "https://www.youtube.com/@dug3fresh",
    tiktok:    "https://www.tiktok.com/@dug3fresh"
  },

  // ── Daily Drop (the feed) ────────────────────────────────────────
  // Newest first. `image` optional.
  drops: [
    { id: "drop-1", time: "TODAY 09:14",     location: "BANGKOK",   caption: "Sunrise over Wat Arun, still half asleep.",     image: "", placeholder: "Selfie · Wat Arun" },
    { id: "drop-2", time: "YESTERDAY 21:40", location: "BANGKOK",   caption: "Khao San Road chaos, met three legends.",       image: "", placeholder: "Selfie · Khao San Rd" },
    { id: "drop-3", time: "2 DAYS AGO",      location: "CHIANG MAI", caption: "Night bazaar noodle stall, 10/10.",            image: "", placeholder: "Selfie · Night Bazaar" },
    { id: "drop-4", time: "4 DAYS AGO",      location: "CHIANG MAI", caption: "Doi Suthep at golden hour.",                   image: "", placeholder: "Selfie · Doi Suthep" },
    { id: "drop-5", time: "LAST WEEK",       location: "HANOI",     caption: "Egg coffee and old quarter alleys.",           image: "", placeholder: "Selfie · Old Quarter" },
    { id: "drop-6", time: "LAST WEEK",       location: "HOI AN",    caption: "Lantern town, best banh mi of the trip.",      image: "", placeholder: "Selfie · Lantern Town" }
  ],

  // ── Wall of Fame (community) ─────────────────────────────────────
  // `h` sets tile height (px) for the masonry look. `image` optional.
  wall: [
    { id: "wall-1", h: 260, caption: "With Nok, Bangkok",            image: "", placeholder: "Community photo" },
    { id: "wall-2", h: 320, caption: "Street food legend, Chiang Mai", image: "", placeholder: "Community photo" },
    { id: "wall-3", h: 220, caption: "Fellow backpackers, Pai",      image: "", placeholder: "Community photo" },
    { id: "wall-4", h: 300, caption: "Tuk-tuk driver, Bangkok",      image: "", placeholder: "Community photo" },
    { id: "wall-5", h: 240, caption: "With Linh, Hanoi",             image: "", placeholder: "Community photo" },
    { id: "wall-6", h: 280, caption: "Market crew, Hoi An",          image: "", placeholder: "Community photo" },
    { id: "wall-7", h: 230, caption: "Random legend, Siem Reap",     image: "", placeholder: "Community photo" },
    { id: "wall-8", h: 310, caption: "Beach day, Bali",              image: "", placeholder: "Community photo" },
    { id: "wall-9", h: 250, caption: "Hostel family, Da Nang",       image: "", placeholder: "Community photo" }
  ]
};
