import type { BlogPost } from '@/utils/blog-types';

export const post: BlogPost = {
  slug: 'are-trimarans-safe',
  title: 'Are Trimarans Safe? Capsize Risk, Stability and Sailing Limits',
  description:
    'Are trimarans safe? What the evidence says about multihull capsize, how trimarans differ from catamarans, why early reefing matters, and what to inspect.',
  primaryKeyword: 'are trimarans safe',
  cluster: 'education',
  keywords: ['trimaran capsize', 'multihull stability', 'trimaran reefing'],
  publishedAt: '2026-11-23',
  updatedAt: '2026-11-08',
  readingMinutes: 6,
  intro:
    'Trimarans are safe when they are well built, well maintained and sailed within their limits, but they are not forgiving in the way a ballasted monohull is. A trimaran resists being blown over better than a catamaran, yet like any multihull it has no ballast keel to bring it upright, so a capsize is a serious event. Safety therefore comes from three things: a sound design, a sound structure, and disciplined sail handling. This article sets out what is documented, what is not, and how to judge a particular boat.',
  sections: [
    {
      heading: 'How is multihull stability different from a monohull?',
      paragraphs: [
        'A monohull gets stability mainly from ballast low in its keel. As it heels, the keel works harder, and a keelboat of normal design will generally come upright after a knockdown. A multihull has stability from its width instead. It stays nearly upright in normal winds, but beyond a certain angle the boat has little reserve, and a boat that goes over tends to stay over.',
        'Practical Sailor, which reviews boats for sailors, puts it bluntly: knockdowns on multihulls are not recoverable, so decisions made early matter more than any calculation ([Practical Sailor](https://www.practical-sailor.com/sailboat-reviews/multihull-capsize-risk-check)). That is why multihull seamanship centres on keeping the boat well inside its limits rather than on recovering from an extreme moment.'
      ]
    },
    {
      heading: 'How do trimarans capsize compared with catamarans?',
      paragraphs: [
        'Sources agree that the two types are exposed to different risks. Practical Sailor’s comparison says trimarans, having more beam, resist capsize by wind alone better than catamarans, and they heel sooner, which gives the crew earlier warning that the boat is overpowered. Catamarans are more vulnerable to wind, but when hit by a breaking wave they tend to slide sideways rather than roll, which signals the crew to bear away ([Practical Sailor, Comparing Trimarans & Catamarans, January 2021](https://www.practical-sailor.com/brief/comparing-trimarans-catamarans)).',
        'The trimaran’s weak point, according to the same article, is waves. Their narrow floats (amas) can bury and cause a broach or capsize when sailing fast on a broad reach, or when a large breaking wave strikes on the beam. Research at the University of Southampton’s Wolfson Unit, by Barry Deakin, reached a similar conclusion about breaking-wave capsize in severe conditions ([Wolfson Unit paper](https://wumtia.soton.ac.uk:443/sites/default/files/uploads/pages/STAB2000BD.pdf)). In short: the trimaran is the more stable type against wind, and the more sensitive to fast sailing in big following or beam seas.'
      ]
    },
    {
      heading: 'What makes a trimaran design safer?',
      paragraphs: [
        'Design details matter more than the number of hulls. The Practical Sailor capsize-risk article discusses several that you can check on any boat:'
      ],
      bullets: [
        '**Float buoyancy.** The article says float buoyancy should exceed 150% of the boat’s displacement, with 200% preferred, and notes that early trimarans with under 100% buoyancy were prone to capsize in breaking waves. Ask the builder or designer for the figure.',
        '**Beam in proportion to length.** More beam raises stability but also raises the risk of pitchpoling (a forward somersault). The article gives about 1.2:1 to 1.8:1 as the usual length-to-beam range for trimarans.',
        '**Float shape.** The comparison article describes modern wave-piercing floats with less flare as more predictable in rough water than older designs.'
      ]
    },
    {
      heading: 'Why does reefing discipline matter so much?',
      paragraphs: [
        'Most documented capsize cases come down to sail handling rather than design alone. Practical Sailor’s article notes that most of the capsizes it describes involved late reefing, poor seamanship or sudden squalls. The practical rules below are drawn from its guidance.'
      ],
      bullets: [
        '**Reef before you feel you need to.** On a trimaran, reef early rather than waiting for the boat to demand it; heeling is your warning, and a leeward float that is submerged by more than about 30 to 40% is described in the article as a sign you are overpowered.',
        '**Reef the main rather than just furling the jib** when beating, so the rig stays balanced.',
        '**Watch for squalls.** Practical Sailor advises dropping all sail when a dark, tall squall line approaches, because a knockdown amounts to a capsize.',
        '**Take the autopilot off and keep a constant watch on the sheets** once gusts are building; the article suggests doing so when gusts reach roughly 30 to 40% of the wind speed needed to lift a hull.',
        '**Slow down off the wind in big seas.** The article describes speed-limiting drogues, which hold a multihull to roughly 4 to 6 knots, as reducing surfing and pitchpole risk. Trailing warps or a drogue is a practical tool; ask experienced owners which they prefer.',
        '**Do not rely on heaving-to or lying ahull** as you might on a monohull; multihulls generally handle these tactics differently, and the article says they work poorly in beam seas.'
      ]
    },
    {
      heading: 'What about structure and hull integrity?',
      paragraphs: [
        'A trimaran’s safety depends on the structure joining the three hulls, and on the hulls themselves. The loads pass through the crossbeams (akas), the float attachments, and, on a folding design, through hinges, pins and lashings. Wear or damage there matters more than cosmetic condition.',
        'Dragonfly states on its own site that a Dragonfly trimaran is unsinkable ([dragonfly.dk](https://dragonfly.dk/?p=2993)). That is the builder’s claim, with no technical details given on that page, so treat it as a starting point for questions rather than a guarantee: ask what makes the boat buoyant when damaged, and check that the compartments are intact on the individual boat you are looking at. The builder’s Swing Wing folding system, which narrows a Dragonfly 28 from 6.70 m to 2.30 m ([Dragonfly 28 specifications](/models/df28)), adds moving parts that an inspection should cover: pivots, bearings, locking pins and the condition of the crossbeams.',
        'Our [used trimaran inspection checklist](/blog/used-trimaran-inspection-checklist) lists what to check when buying. A professional survey by someone who knows multihulls is the proper way to confirm structural condition.'
      ]
    },
    {
      heading: 'Can you rely on a capsize rating or an official number?',
      paragraphs: [
        'Be cautious. There is no single recognised figure that tells you a trimaran is safe. The capsize screening formula used in the Offshore Special Regulations was developed for monohulls, so a value shown for a multihull on a boat database does not tell you much. The UK’s 1993 Code of Practice for small commercial sailing vessels did introduce stability requirements for multihulls, which compare the wind heeling moment against the righting moment to find the wind speed that would capsize the boat ([summary on TRID](https://trid.trb.org/View/449123)), but that applies to commercial vessels, not private boats.',
        'We also looked for reliable public statistics on capsize rates by boat type and did not find any. Treat anyone who quotes a precise percentage with suspicion. If you plan to race or sail offshore, the World Sailing Offshore Special Regulations contain a separate section for multihulls covering equipment and training requirements, but meeting them is not a measure of how safe a boat is; check the current text on the World Sailing site.'
      ]
    },
    {
      heading: 'Checklist: what makes a trimaran safe to sail?',
      paragraphs: ['Use this before you buy and again before each season.'],
      bullets: [
        'Known float buoyancy figure, and a design with reasonable length-to-beam proportions.',
        'Hulls, crossbeams, float attachments and (if folding) hinges, pivots and pins inspected, with no unexplained repairs.',
        'A reefing system you can use quickly, shorthanded, with the helm held. Practise it in moderate wind.',
        'Rig, standing rigging and chainplates in good condition.',
        'Lifejackets, harnesses and jacklines, a means of calling for help, and a plan for what the crew does if the boat is overpowered.',
        'A skipper who has sailed multihulls, or who has had time with an experienced owner before taking out the family.'
      ]
    },
    {
      heading: 'So, are trimarans safe?',
      paragraphs: [
        'They are safe enough for people who respect the limits, and unforgiving of those who do not. A trimaran suits sailors who like paying attention to the rig and the sea. If you want to see what the range looks like, browse the [Dragonfly models](/models) or current [Dragonflies for sale](/forsale).'
      ]
    }
  ]
};
