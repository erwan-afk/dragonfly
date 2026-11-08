import type { BlogPost } from '@/utils/blog-types';

export const post: BlogPost = {
  slug: 'sailboat-rig-types',
  title: 'Sailboat Rig Types Explained, Including Multihull Rigs',
  description:
    'Sailboat rig types explained: sloop, cutter, ketch, yawl, schooner and catboat, masthead versus fractional, and how trimaran rigs and Dragonfly masts differ.',
  primaryKeyword: 'sailboat rig types',
  cluster: 'education',
  keywords: ['sloop vs cutter', 'ketch vs yawl', 'fractional rig', 'trimaran rig'],
  publishedAt: '2026-12-20',
  updatedAt: '2026-11-08',
  readingMinutes: 7,
  intro:
    'The main sailboat rig types are named by how many masts the boat has and how its sails are arranged: a sloop has one mast with a mainsail and one headsail, a cutter adds a second headsail, a ketch and a yawl have two masts, a schooner has two or more with the taller mast aft, and a catboat has one mast and one sail. Most modern boats, including nearly every trimaran, are sloops. This guide explains each type in plain language, then the masthead versus fractional split that matters when you look at a boat, and finally how multihull rigs, including the carbon masts and downwind sails on Dragonfly trimarans, differ from monohull ones. No diagrams are included, so each rig is described in words you can check against a photo.',
  sections: [
    {
      heading: 'How are sailboat rigs classified?',
      paragraphs: [
        'A rig is the mast or masts plus the sails and the wires or spars that hold them up. Two questions identify almost any rig: how many masts are there, and how many sails are set on the mast in front of the aft-most one. Everything else, such as whether the mainsail has a gaff or is triangular (Bermudan), describes the sail shape rather than the rig type. A sloop, a cutter or a ketch can all be either.',
        'Sources broadly agree on the basic names, and the main disagreement is over where a ketch ends and a yawl begins, which is covered below. One useful beginner guide is [Sailboat Cruising’s overview of rigs](https://www.sailboat-cruising.com/types-of-sailboats.html), which the descriptions here follow.'
      ]
    },
    {
      heading: 'Sloop: one mast, two sails',
      paragraphs: [
        'A sloop has a single mast, one mainsail and one headsail (a jib or genoa) set on the forestay. It is the most common rig for cruising and racing because it is simple, efficient to windward and easy to handle with a small crew. Control lines are few, there is one mast to inspect and one set of standing rigging to maintain.',
        'The limitation is that the sail area is concentrated in two sails. When the wind rises you reef the main and furl or change the headsail, and a large boat can have heavy sails to manage. For small and medium cruising boats, that is a fair trade.'
      ]
    },
    {
      heading: 'Cutter: a sloop with a second headsail',
      paragraphs: [
        'A cutter also has one mast, but carries two headsails: a jib on the forestay and a smaller staysail on an inner forestay. The split headsail gives flexibility. In strong wind, the staysail with a reefed main is a balanced, low-drag combination, which is why cutters are associated with offshore cruising.',
        'The cost is complexity: an extra stay, extra sail and sheets, and a more cluttered foredeck. In a sloop vs cutter choice, a cutter makes sense if you expect to cross open water and want a heavy-weather option, while a sloop suits coastal sailing and shorthanded crews.'
      ]
    },
    {
      heading: 'Ketch versus yawl: where is the mizzen?',
      paragraphs: [
        'Both rigs have two masts: a main mast and a smaller mizzen mast behind it. The usual rule is positional. On a ketch the mizzen stands forward of the rudder post, and it carries a useful amount of sail, so in a blow you can sail on the headsail and mizzen alone. On a yawl the mizzen stands aft of the rudder post, and its small sail (the jigger) mainly balances the helm rather than driving the boat.',
        'Some writers argue the real distinction is the size of the mizzen rather than its position, so treat the rudder-post rule as a convention and not a law. Either way, splitting the sail area makes each sail smaller and easier to handle, at the price of a second mast, more rigging, and generally less efficient windward performance than a sloop. Both rigs are uncommon on new boats.'
      ]
    },
    {
      heading: 'Schooner and catboat: the two ends of the scale',
      paragraphs: [
        'A schooner has two or more masts, with the forward mast the same height as or shorter than the aft one. This is what separates it from a ketch, where the forward mast is the tallest. Schooners are powerful and traditional, but they need more crew and are a poor choice for shorthanded sailing.',
        'A catboat is at the other extreme: one mast set far forward, a single sail and no jib. Catboats typically have a wide beam and shallow draft, and they perform poorly upwind. Their appeal is simplicity, which is why you see them as day boats rather than offshore cruisers.'
      ]
    },
    {
      heading: 'Masthead versus fractional rig: what changes?',
      paragraphs: [
        'This is a sloop variation you will meet on every used-boat listing. On a masthead rig the forestay attaches at the top of the mast. On a fractional rig it attaches lower, typically between about one eighth and one quarter of the mast length below the top, according to [Wikipedia’s entry on fractional rigs](https://en.wikipedia.org/wiki/Fractional_rig). A three-quarter rig is one where the forestay attaches about three-quarters of the way up.',
        'The effects are practical rather than dramatic. A fractional rig puts the mast further forward, which allows a larger mainsail and a smaller, usually non-overlapping jib. The mast bends more easily, so the crew can flatten the mainsail with the backstay or other controls. Dropping the jib in strong wind reduces the load on the rig and hull, which is one reason lightly built multihulls often use this arrangement. A masthead rig is common on larger cruising keelboats and generally carries a bigger downwind sail.',
        'Enthusiast forums disagree about how much speed difference there really is, so treat claims that one is simply faster with caution. For a buyer, the better question is how easy the sails are to handle shorthanded and what a replacement costs.'
      ]
    },
    {
      heading: 'How do multihull and trimaran rigs differ?',
      paragraphs: [
        'Most trimarans are fractionally rigged sloops with a large mainsail doing the driving. Many multihulls have no backstay at all: swept-back spreaders and a wide shroud base brace the mast instead, which leaves the mainsail free to carry a large roach (the curved area behind the straight line from head to clew). The Cruising World article [How to Pick New Sails for a Multihull](https://cruisingworld.com/?p=44302) notes that this allows a high-roach main, but with trade-offs: sails of that kind need heavier material than a similar monohull sail, and swept spreaders can chafe the battens when the sail is eased downwind.',
        'The practical consequences for an owner are listed below.'
      ],
      bullets: [
        '**Load on the main:** a big mainsail puts heavy loads on the mainsheet, traveller and reefing system, which is why early reefing matters. Our guide to [sailing a trimaran](/blog/how-to-sail-a-trimaran) covers the technique.',
        '**Batten and sail condition:** check battens, batten pockets and chafe patches where the sail meets the spreaders.',
        '**Light-air gybing:** with no backstay the main can behave differently when gybing; one forum user calls it a pain in light air, so this is anecdotal and worth asking owners of the specific boat about.',
        '**Downwind sails are part of the rig:** a trimaran’s speed on a reach comes largely from a gennaker, asymmetric spinnaker or Code 0, set on a bowsprit or the bow, so the sail wardrobe is part of the value of a used boat.'
      ]
    },
    {
      heading: 'What do Dragonfly rigs look like?',
      paragraphs: [
        'Dragonfly trimarans are sloops. The builder’s pages show the detail by model, and sources do not always agree, so check the spec sheet of the specific boat. The Dragonfly 28 page on [dragonfly.dk](https://dragonfly.dk/boats/dragonfly-28/) lists a furling genoa, a lazy-jack system for the mainsail so the boat can be left ready to sail in harbour, a bowsprit for light-wind sailing, and a Code 0 and an asymmetric spinnaker. For the new Dragonfly 36, the [specifications page](https://dragonfly.dk/dragonfly-36-specifications/) lists a carbon mast (16.50 m in Touring, 18.50 m in Performance), a fixed 0.90 m bowsprit and a self-tacking jib, with a mainsail of 61 m² in Touring and 73 m² in Performance, and an asymmetric spinnaker of 125 m² and 145 m².',
        'The [Dragonfly 28](/models/df28) and its smaller sibling the [Dragonfly 25](/models/df25) are the usual choices for owners who want a rig one or two people can handle. Our notes on the [Dragonfly 28 versions](/blog/dragonfly-28-touring-sport-performance) explain how mast height and sail wardrobe separate Touring from Performance.'
      ]
    },
    {
      heading: 'Which rig suits which sailing, and what to check on a used boat?',
      paragraphs: [
        'As a simple decision guide: choose a sloop for almost every coastal and fast cruising use; consider a cutter if you plan open-water passages and want a heavy-weather headsail; ketches, yawls and schooners are mostly choices for existing boats, not for new buying; catboats suit day sailing. For a used trimaran, the rig deserves its own inspection line alongside the hulls and beams. Our [used trimaran inspection checklist](/blog/used-trimaran-inspection-checklist) covers it in detail.'
      ],
      bullets: [
        'Ask for the mast material and age. Carbon masts are lighter, but any damage needs specialist assessment.',
        'Look at the standing rigging, spreaders and chainplates for corrosion, cracks or movement.',
        'Inspect sails for UV damage, stretched leeches and chafe, and ask which downwind sails are included.',
        'Check that reefing lines, furlers and lazy jacks run freely, because they are what keeps the rig manageable in a rising wind.',
        'Browse [Dragonflys currently advertised](/forsale) and compare the sail wardrobes listed, since two otherwise similar boats can differ by thousands in sails alone.'
      ]
    }
  ]
};
