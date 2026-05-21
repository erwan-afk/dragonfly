export interface ModelSpec {
  label: string;
  value: string;
}

export interface ModelData {
  key: string;
  name: string;
  tagline: string;
  yearsProduced: string;
  designer: string;
  image: string;
  overview: string[];
  history: string[];
  sailing: string;
  audience: string;
  specs: ModelSpec[];
}

export const modelsData: Record<string, ModelData> = {
  df25: {
    key: 'df25',
    name: 'Dragonfly 25',
    tagline: 'The compact trailerable trimaran that started a new era.',
    yearsProduced: '2009 – present',
    designer: 'Jens Quorning',
    image: '/models/df25.png',
    overview: [
      'The Dragonfly 25 is the smallest model in the modern Dragonfly range, but it punches well above its weight. Designed as a fully trailerable trimaran, it brings the legendary Dragonfly sailing experience to owners who want the freedom of cruising different sailing grounds without ever needing a marina berth.',
      'Despite its compact length, the boat offers a surprisingly spacious cockpit, a clever interior with two berths and basic galley facilities, and the unmistakable Dragonfly Swing Wing system that lets the amas fold in just minutes. With a beam reduced from over five metres on the water down to a road-legal 2.5 metres on the trailer, the boat is genuinely ready to go anywhere.',
      'Sailors regularly describe the 25 as a perfect dayboat for couples and small families that still has the speed and stability needed for coastal passages. It is one of the most popular Dragonflies on the second-hand market, in large part because of how few compromises it makes for its size.'
    ],
    history: [
      'Launched at the 2009 boat show season, the Dragonfly 25 was developed to fill a clear gap below the Dragonfly 28 — a smaller, lighter, even more affordable trimaran that retained the build quality of its bigger siblings. It quickly became one of the brand’s best-selling models.',
      'A "Sport" version was added shortly after launch, with a taller carbon mast, larger sail plan and a sportier rudder, aimed at owners who wanted to extract maximum performance from the platform. Over the years the 25 has received continuous refinements to deck layout, rigging and interior fit-out, while the core hull and Swing Wing geometry have remained largely unchanged.'
    ],
    sailing: 'The Dragonfly 25 sails like a much larger boat. The fine-entry hulls slice cleanly through chop, the wide stance from the amas keeps the boat upright, and a well-tuned rig will see double-digit speeds without drama. Light helm, predictable behaviour at the limit and the ability to fly a hull just enough to feel alive make it equally rewarding for new multihull sailors and experienced racers.',
    audience: 'Couples, families with one or two children, and active sailors who want a fast trailerable platform for weekend cruising and the occasional regatta. Also a strong choice for anyone moving from a dinghy to their first keelboat without giving up performance.',
    specs: [
      { label: 'Length overall', value: '7.75 m' },
      { label: 'Beam (sailing)', value: '5.50 m' },
      { label: 'Beam (folded)', value: '2.50 m' },
      { label: 'Draft (board up / down)', value: '0.40 m / 1.50 m' },
      { label: 'Displacement', value: '950 kg' },
      { label: 'Sail area (main + jib)', value: '38 m²' },
      { label: 'Berths', value: '2 + 2' },
      { label: 'Engine', value: '4 – 8 hp outboard' }
    ]
  },

  df28: {
    key: 'df28',
    name: 'Dragonfly 28',
    tagline: 'The benchmark folding trimaran for fast family cruising.',
    yearsProduced: '2007 – present',
    designer: 'Jens Quorning',
    image: '/models/df28.png',
    overview: [
      'The Dragonfly 28 is widely regarded as the model that perfected the folding trimaran formula. Combining serious cruising comfort with the kind of acceleration usually reserved for racing boats, it has become the reference point against which other small multihulls are measured.',
      'Available in Touring, Sport and Performance configurations, the 28 lets each owner choose the balance between speed and cruising-friendly handling. The interior offers headroom rare for a boat of this size, a real galley, an enclosed head and proper sea berths — turning weekend escapes into long summer cruises without compromise.',
      'It remains one of Dragonfly’s most produced models, with a strong owner community and an active racing scene from northern Europe to the Mediterranean.'
    ],
    history: [
      'Introduced in 2007, the Dragonfly 28 replaced the long-running Dragonfly 920 as the yard’s mid-size offering. Jens Quorning kept the proven Swing Wing folding mechanism but redesigned the hulls for a finer entry, lower wetted surface and significantly more interior volume.',
      'Over the years the 28 has been continually updated: carbon mast options, larger gennakers, refined deck hardware, and a 2017 facelift that modernised the cockpit ergonomics. It is also the model that introduced many of the features now standard across the entire Dragonfly range.'
    ],
    sailing: 'On the water the 28 feels effortless. With the daggerboard down it tracks beautifully upwind, and reaching under gennaker it routinely cracks 18 to 20 knots in good conditions. The combination of light displacement, wide stance and sensible sail plan makes it forgiving and very fast — a boat you can push hard and still feel completely in control.',
    audience: 'Cruising couples and families who want a true weekender or summer cruiser without giving up the performance and excitement of a multihull. The Sport and Performance versions also appeal to short-handed racers.',
    specs: [
      { label: 'Length overall', value: '8.75 m' },
      { label: 'Beam (sailing)', value: '6.70 m' },
      { label: 'Beam (folded)', value: '2.30 m' },
      { label: 'Draft (board up / down)', value: '0.45 m / 1.55 m' },
      { label: 'Displacement', value: '1 350 kg' },
      { label: 'Sail area (main + jib)', value: '50 m²' },
      { label: 'Berths', value: '4 + 2' },
      { label: 'Engine', value: '6 – 10 hp outboard' }
    ]
  },

  df32: {
    key: 'df32',
    name: 'Dragonfly 32',
    tagline: 'Fast, comfortable, and ready for serious passage-making.',
    yearsProduced: '2010 – present',
    designer: 'Jens Quorning',
    image: '/models/df32.png',
    overview: [
      'The Dragonfly 32 is where folding trimaran design steps clearly into the cruising-yacht category. Long enough to offer genuine offshore comfort, light enough to deliver the speed Dragonfly is known for, it is the model many owners eventually upgrade to after a smaller Dragonfly proves to be everything they hoped — and they want more of it.',
      'The interior is a major step forward: standing headroom throughout, a U-shaped saloon, a forward owner’s cabin, an aft double, and a fully enclosed head with shower. Yet the boat still folds to under three metres of beam at the marina, and can be transported on a low-loader for winter storage or a season abroad.',
      'It is offered in Touring, Supreme and Ultimate trims, ranging from a relaxed coastal cruiser to a fully optimised performance platform with carbon rig and lightweight construction.'
    ],
    history: [
      'When it launched in 2010, the Dragonfly 32 immediately won several "Boat of the Year" awards and confirmed Quorning Boats as one of the most innovative builders of cruising multihulls in the world. The model marked a step up in finish quality, deck hardware and interior design compared to earlier Dragonflies.',
      'A facelifted Evolution version followed, adding a new coachroof shape, larger windows and a refreshed deck layout. The 32 has been continuously refined ever since, with modern sail-handling systems, electric winches, and lithium-based electrical packages now standard options.'
    ],
    sailing: 'Few 32-foot cruisers can match the 32’s combination of speed and comfort. Reaching speeds of 20+ knots are routine; 24-hour passages of 250 to 280 nautical miles are well within reach for skilled crews. Yet the boat is famously easy to short-hand, with all controls leading aft to the helm.',
    audience: 'Cruising couples doing extended coastal or offshore passages, owners trading down from larger monohull cruisers, and performance-oriented families who want a fast yet liveable boat for one to three week summer trips.',
    specs: [
      { label: 'Length overall', value: '9.88 m' },
      { label: 'Beam (sailing)', value: '7.80 m' },
      { label: 'Beam (folded)', value: '2.95 m' },
      { label: 'Draft (board up / down)', value: '0.50 m / 1.85 m' },
      { label: 'Displacement', value: '2 300 kg' },
      { label: 'Sail area (main + jib)', value: '70 m²' },
      { label: 'Berths', value: '4 + 2' },
      { label: 'Engine', value: '15 – 20 hp inboard or outboard' }
    ]
  },

  df35: {
    key: 'df35',
    name: 'Dragonfly 35',
    tagline: 'The flagship folding trimaran — luxury at speed.',
    yearsProduced: '2014 – present',
    designer: 'Jens Quorning',
    image: '/models/df35.png',
    overview: [
      'The Dragonfly 35 is the yard’s flagship trimaran, designed for owners who refuse to compromise between performance, comfort and aesthetics. Every detail — from the sweeping deck lines to the joinery in the saloon — reflects the higher level of finish the 35 brings to the range.',
      'It offers two interior layouts, a generous owner’s cabin forward, a true offshore galley and a comfortable navigation station. With the right sail wardrobe it is fully capable of long ocean passages, while still folding for marina berthing — a unique proposition in this size range.',
      'Available in Touring and Ultimate versions, with carbon mast, lightweight construction and a long list of high-end equipment options for owners who want a truly bespoke boat.'
    ],
    history: [
      'Launched in 2014 as the long-awaited replacement for the Dragonfly 1200, the 35 was a clean-sheet design that took everything the yard had learned from the 32 and applied it to a larger, more sophisticated platform. It immediately set a new standard for the brand.',
      'Several technical innovations debuted on the 35, including a redesigned Swing Wing mechanism, an improved daggerboard system, and a fully integrated electrical and electronic platform. Over the years carbon mast, twin rudders and water-ballast options have been added for the Ultimate version.'
    ],
    sailing: 'The 35 sails with the easy authority of a much larger yacht while keeping the responsiveness Dragonfly is famous for. Tracking upwind is exceptional thanks to the long, fine bows; reaching speeds in the high teens to mid-twenties are the boat’s natural cruising mode. It can be sailed comfortably by a couple, yet pushed hard by a racing crew.',
    audience: 'Experienced sailors stepping up from smaller multihulls, couples planning extended offshore cruising, and owners looking for a truly premium cruising trimaran that can also turn heads at the start line.',
    specs: [
      { label: 'Length overall', value: '11.00 m' },
      { label: 'Beam (sailing)', value: '8.35 m' },
      { label: 'Beam (folded)', value: '3.40 m' },
      { label: 'Draft (board up / down)', value: '0.65 m / 2.10 m' },
      { label: 'Displacement', value: '3 200 kg' },
      { label: 'Sail area (main + jib)', value: '90 m²' },
      { label: 'Berths', value: '4 + 2' },
      { label: 'Engine', value: '20 – 30 hp inboard saildrive' }
    ]
  },

  df40: {
    key: 'df40',
    name: 'Dragonfly 40',
    tagline: 'The ultimate cruising trimaran — fast, folding, fully equipped.',
    yearsProduced: '2020 – present',
    designer: 'Jens Quorning',
    image: '/models/df40.png',
    overview: [
      'The Dragonfly 40 is the most ambitious project ever undertaken by Quorning Boats. It brings the folding-trimaran concept to a true 40-foot cruising yacht, with the volume, equipment and autonomy needed for blue-water sailing — yet still able to fold for marina berthing.',
      'Two layout versions are offered: an Ultimate performance configuration with carbon mast and lightweight construction, and a Touring layout with a more traditional cruising interior including three cabins, two heads, a forward-facing galley and a generous saloon.',
      'It targets owners who want one boat to do everything: weekend cruising, summer Mediterranean trips, transatlantic passages and the occasional multihull regatta — all without the marina-fee penalties typical of large multihulls.'
    ],
    history: [
      'Announced in 2018 and launched in 2020, the Dragonfly 40 was the result of years of development and a deliberate decision by the yard to push the folding-trimaran concept to a much larger scale. It debuted to widespread industry recognition and won several prestigious awards in its first season.',
      'The 40 introduced a new generation of Swing Wing geometry adapted for the size, an enhanced rig with self-tacking jib and easy-to-handle gennaker setup, and a complete electrical platform built around lithium battery banks and significant solar capacity.'
    ],
    sailing: 'On the water the 40 is genuinely fast: 20+ knots reaching, 18 to 20 knots upwind in fresh conditions, and very comfortable averages of 12 to 15 knots on long passages. Despite its size, the deck layout and sail-handling systems make short-handed sailing feel natural — many owners regularly cruise as a couple.',
    audience: 'Experienced cruising couples and small crews planning serious offshore work, owners moving from large monohull cruisers, and anyone wanting the absolute best of the folding-trimaran concept.',
    specs: [
      { label: 'Length overall', value: '12.30 m' },
      { label: 'Beam (sailing)', value: '9.20 m' },
      { label: 'Beam (folded)', value: '3.95 m' },
      { label: 'Draft (board up / down)', value: '0.70 m / 2.20 m' },
      { label: 'Displacement', value: '5 000 kg' },
      { label: 'Sail area (main + jib)', value: '120 m²' },
      { label: 'Berths', value: '6 + 2' },
      { label: 'Engine', value: '40 – 50 hp inboard saildrive' }
    ]
  },

  df800: {
    key: 'df800',
    name: 'Dragonfly 800',
    tagline: 'The classic that introduced a generation to fast trimaran sailing.',
    yearsProduced: '1986 – 1995',
    designer: 'Børge Quorning',
    image: '/models/df800.png',
    overview: [
      'The Dragonfly 800 is one of the foundation models of the modern Dragonfly story. Built between 1986 and 1995, it introduced thousands of sailors to the unique experience of fast, stable multihull cruising on a boat that could still be folded and trailered.',
      'Its blend of speed, stability and simplicity made it an instant classic. Many of the earlier hulls are still actively sailed today, often passed down or refit by enthusiastic owners — a testament to the strength of the original design and build quality.',
      'For buyers entering the Dragonfly world today, the 800 represents a very accessible way in: comparatively affordable on the second-hand market, easy to maintain, and still genuinely fun to sail.'
    ],
    history: [
      'Designed by Børge Quorning, the 800 was developed as a successor to the very early Dragonfly models. Its arrival in 1986 marked a significant evolution: a more refined hull shape, a better organised interior, and a Swing Wing folding system that became smoother and more reliable than ever.',
      'Production continued for almost a decade, with subtle improvements over the years. The 800 was eventually replaced by the Dragonfly 920, but its legacy lives on in the design DNA of every Dragonfly built since.'
    ],
    sailing: 'The 800 is famous for its predictable, forgiving behaviour — a boat that flatters its crew. It accelerates easily in light winds, holds its line beautifully on a reach, and handles a fresh breeze without drama. It is not as quick as the modern boats, but it carries enough sail to be very enjoyable on a day out.',
    audience: 'Buyers looking for a well-priced entry point into Dragonfly ownership, owners who value classic build quality, and anyone interested in the heritage of the brand.',
    specs: [
      { label: 'Length overall', value: '8.00 m' },
      { label: 'Beam (sailing)', value: '5.70 m' },
      { label: 'Beam (folded)', value: '2.50 m' },
      { label: 'Draft (board up / down)', value: '0.40 m / 1.30 m' },
      { label: 'Displacement', value: '1 100 kg' },
      { label: 'Sail area (main + jib)', value: '38 m²' },
      { label: 'Berths', value: '4' },
      { label: 'Engine', value: '5 – 8 hp outboard' }
    ]
  },

  df920: {
    key: 'df920',
    name: 'Dragonfly 920',
    tagline: 'The mid-sized Dragonfly that defined family trimaran cruising in the 1990s.',
    yearsProduced: '1995 – 2007',
    designer: 'Børge Quorning',
    image: '/models/df920.png',
    overview: [
      'The Dragonfly 920 is the model that made folding trimarans a mainstream choice for cruising families in the 1990s and 2000s. Larger and more comfortable than the 800, it offered standing headroom, real cruising accommodation and a serious sail plan — without losing the brand’s trademark folding ability.',
      'Hundreds of 920s were built over a 12-year production run, and the boat remains one of the most popular Dragonflies on the second-hand market. Many are still being sailed actively today, often by their original owners.',
      'Its proven design, strong owners’ network and large pool of available spare parts make the 920 a particularly safe entry point into the brand for buyers who want a capable cruising trimaran without paying new-boat prices.'
    ],
    history: [
      'Launched in 1995 as the successor to the Dragonfly 800, the 920 was significantly reworked to offer more interior volume, a better cockpit and a more powerful rig. It quickly became the yard’s best-selling model.',
      'The 920 received several updates during its production run, including the Mk II version with a redesigned coachroof, larger windows and a more modern interior. It was eventually replaced in 2007 by the all-new Dragonfly 28, which built directly on the lessons learned from the 920.'
    ],
    sailing: 'The 920 is a relaxed, easy-going cruiser that comes alive when the wind picks up. It tracks well upwind, accelerates smoothly off the wind, and is happy to be pushed hard or gently coaxed along — depending on the crew’s mood. Its handling under sail is one of the reasons it is still so beloved by owners.',
    audience: 'Cruising families looking for a classic, capable mid-sized trimaran at a sensible price, and owners who want a boat with a strong community and proven track record.',
    specs: [
      { label: 'Length overall', value: '9.20 m' },
      { label: 'Beam (sailing)', value: '6.60 m' },
      { label: 'Beam (folded)', value: '2.40 m' },
      { label: 'Draft (board up / down)', value: '0.45 m / 1.50 m' },
      { label: 'Displacement', value: '1 600 kg' },
      { label: 'Sail area (main + jib)', value: '50 m²' },
      { label: 'Berths', value: '4 + 2' },
      { label: 'Engine', value: '8 – 10 hp outboard or inboard' }
    ]
  },

  df1000: {
    key: 'df1000',
    name: 'Dragonfly 1000',
    tagline: 'A cruising trimaran built for serious distance.',
    yearsProduced: '1996 – 2010',
    designer: 'Børge Quorning',
    image: '/models/df1000.png',
    overview: [
      'The Dragonfly 1000 was developed in the late 1990s as the larger sister to the Dragonfly 920, aimed at owners who wanted more interior volume, more carrying capacity and the comfort needed for longer cruises. It offered a notable step up in liveability without losing the folding-trimaran DNA.',
      'With proper standing headroom throughout, a real galley, enclosed heads with shower and a comfortable saloon, the 1000 was a true cruising boat — one that could spend weeks on board without the crew feeling cramped. Many were sold to owners planning long Mediterranean or transatlantic adventures.',
      'On the second-hand market the 1000 represents a sweet spot for buyers who want significant cruising capability and the famous Dragonfly performance, at a much lower price than newer flagship models.'
    ],
    history: [
      'Production of the Dragonfly 1000 ran from 1996 to roughly 2010, with continuous detail improvements over the years. The boat was eventually superseded by the next-generation Dragonfly 32 and 35, which took advantage of newer construction techniques and modern interior design.',
      'A "Swing Wing" folding system tailored to the larger size was one of its key engineering challenges, and the solution developed for the 1000 informed many of the systems used on later Dragonflies.'
    ],
    sailing: 'The 1000 is a stable, fast cruiser that prefers a fresh breeze. It is more of a comfortable mile-eater than a high-performance racer, but with the right sails it will still post very respectable averages on long passages, regularly outpacing similarly sized monohulls.',
    audience: 'Cruising couples and families planning extended trips, second-hand buyers who want maximum interior volume per euro spent, and owners who value the older Quorning build quality.',
    specs: [
      { label: 'Length overall', value: '10.00 m' },
      { label: 'Beam (sailing)', value: '7.20 m' },
      { label: 'Beam (folded)', value: '2.95 m' },
      { label: 'Draft (board up / down)', value: '0.50 m / 1.80 m' },
      { label: 'Displacement', value: '2 200 kg' },
      { label: 'Sail area (main + jib)', value: '60 m²' },
      { label: 'Berths', value: '4 + 2' },
      { label: 'Engine', value: '15 – 20 hp inboard' }
    ]
  },

  df1200: {
    key: 'df1200',
    name: 'Dragonfly 1200',
    tagline: 'The original luxury folding trimaran flagship.',
    yearsProduced: '2003 – 2014',
    designer: 'Børge Quorning',
    image: '/models/df1200.png',
    overview: [
      'When it was introduced, the Dragonfly 1200 was the largest folding trimaran the yard had ever built — a true flagship aimed at experienced cruisers who wanted the ultimate combination of comfort, autonomy and performance.',
      'Its generous interior offered three sleeping areas, a true offshore galley, and a fully equipped navigation station. With its proven Swing Wing system scaled up for the size, it could still take advantage of regular marina berths despite its impressive sailing beam.',
      'Although replaced in the line-up by the Dragonfly 35, the 1200 remains a sought-after boat on the second-hand market, prized by owners who want a large cruising trimaran with timeless lines and proven offshore credentials.'
    ],
    history: [
      'Launched in 2003, the Dragonfly 1200 was the first Dragonfly designed specifically for serious offshore cruising. It built on everything Quorning had learned with the 1000 and earlier flagships, while raising the bar in interior finish and equipment levels.',
      'Production ran for over a decade before the 1200 was retired in favour of the smaller, more modern and more efficient Dragonfly 35. Owners often refit older 1200s with modern electronics, sail wardrobes and lithium electrical systems to keep them at the cutting edge.'
    ],
    sailing: 'The 1200 sails like the big cruiser it is: stable, predictable, and very comfortable in heavy weather. It is not a racing boat, but with sail area trimmed for the conditions it will sustain very respectable cruising speeds and feels safe and reassuring offshore.',
    audience: 'Experienced cruising couples and small crews planning long-distance passages, buyers looking for a large second-hand multihull with proven build quality, and owners who appreciate the older Quorning aesthetic.',
    specs: [
      { label: 'Length overall', value: '12.00 m' },
      { label: 'Beam (sailing)', value: '8.50 m' },
      { label: 'Beam (folded)', value: '3.50 m' },
      { label: 'Draft (board up / down)', value: '0.65 m / 2.00 m' },
      { label: 'Displacement', value: '3 800 kg' },
      { label: 'Sail area (main + jib)', value: '95 m²' },
      { label: 'Berths', value: '6 + 2' },
      { label: 'Engine', value: '25 – 30 hp inboard saildrive' }
    ]
  }
};

export const allModels = Object.values(modelsData);

export function getModelData(key: string): ModelData | null {
  return modelsData[key] ?? null;
}
