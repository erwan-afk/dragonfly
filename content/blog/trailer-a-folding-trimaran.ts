import type { BlogPost } from '@/utils/blog-types';

export const post: BlogPost = {
  slug: 'trailer-a-folding-trimaran',
  title: 'How to Trailer a Trimaran: Models, Weights, Width and Licences',
  description:
    'Can you trailer a trimaran? Which Dragonfly models fold to road width, what they weigh, the 2.55 m limit, licence categories, launching and mast handling.',
  primaryKeyword: 'trailer a trimaran',
  cluster: 'transport',
  keywords: ['trailerable trimaran', 'towing a folding trimaran', 'trimaran trailer width'],
  publishedAt: '2026-12-24',
  updatedAt: '2026-11-08',
  readingMinutes: 7,
  intro:
    'You can trailer a trimaran behind a car only if it folds to road width and the boat and trailer together stay inside your vehicle and licence limits. Of the current Dragonfly range, the Dragonfly 25 (2.30 m folded) and Dragonfly 28 (2.54 m folded) are the ones built to travel this way: the 2.55 m limit that applies to trailers in Great Britain and under EU rules is the number to measure against. From the 33 upwards the folded beam is about 3.70 m or more, which means a wide-load trailer and a professional haulier. This guide covers the figures from the builder, the weight and licence arithmetic, launching and mast handling, and a pre-trip checklist.',
  sections: [
    {
      heading: 'Which Dragonfly models can you actually trailer?',
      paragraphs: [
        'The builder publishes folded dimensions on each model’s specification page at [dragonfly.dk](https://dragonfly.dk). The figures below are the standard dry boat, ready to sail, without extra equipment, and they do not include the trailer. The builder’s own pages say all figures are indications only.'
      ],
      bullets: [
        '**Dragonfly 25:** 2.30 m folded beam, 8.95 m folded length, 1,150 kg ([specification page](https://dragonfly.dk/dragonfly-25-specifications/)).',
        '**Dragonfly 28:** 2.54 m folded beam, 9.99 m folded length (Touring) or 10.40 m (Performance), 2,100 kg ([specification page](https://dragonfly.dk/dragonfly-28-specifications/)).',
        '**Dragonfly 33 (provisional):** 3.70 m folded beam, 12.80 m folded length, 3,900 kg ([specification page](https://dragonfly.dk/dragonfly-33-specifications/)).',
        '**Dragonfly 36:** 3.70 m folded beam, 13.43 m folded length, 4,500 kg ([specification page](https://dragonfly.dk/dragonfly-36-specifications/)).',
        '**Dragonfly 40:** 4.00 m folded beam, 14.17 m folded length, 5,000 to 5,900 kg depending on version ([specification page](https://dragonfly.dk/dragonfly-40-specifications/)).'
      ]
    },
    {
      heading: 'Why do some sources give different folded widths?',
      paragraphs: [
        'You will find older or secondary figures that disagree with the list above. The 3Hulls [Dragonfly 25](/models/df25) and [Dragonfly 28](/models/df28) model pages carry a 2.50 m and 2.30 m folded beam respectively, a [yacht.de comparison](https://www.yacht.de/en/yachts/catamarans/folding-pivoting-sliding-which-trailerable-trimaran-offers-the-best-solution/) gives 2.30 m for the 25, and the builder now lists 2.30 m and 2.54 m. Dry weights differ even more between sources, partly because older figures were for earlier versions and partly because some quote the boat without gear.',
        'For a used boat, the only reliable number is the one you measure: fold it, then measure the widest point of the whole load on its trailer. If you are comparing a specific boat, check the spec sheet for its exact model year and version, and treat the builder’s current page as the baseline. Folding mechanics are covered separately in our [Swing Wing explainer](/blog/dragonfly-swing-wing-explained).'
      ]
    },
    {
      heading: 'What width limits apply on the road?',
      paragraphs: [
        'The general EU limit for road vehicles is 2.55 m under [Council Directive 96/53/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:01996L0053-20150526). GOV.UK gives the same figure for Great Britain: [the maximum trailer width for any towing vehicle is 2.55 metres](https://www.gov.uk/towing-with-car/weight-and-width-limits). It also limits a trailer drawn by a vehicle of up to 3,500 kg to 7 metres in length, excluding the A-frame.',
        'This is why the Dragonfly 28 is a tight fit. At 2.54 m folded, the boat leaves almost no margin, and what counts is the widest part of the entire load, including any hull fittings, fenders or lights. The Dragonfly 25 at 2.30 m has some room. In Great Britain, loads wider than 2.9 m are treated as abnormal loads and need prior notice to the police: Highways England’s [aide-memoire](https://www.highwaysengland.co.uk/media/u3lhku2p/aide-memoire-notification-requirements-for-moving-abnormal-loads.pdf) lists two clear working days’ notice, and GOV.UK publishes [application and notification forms](https://www.gov.uk/government/publications/abnormal-load-movements-application-and-notification-forms). At 3.70 m and 4.00 m, the 33, 36 and 40 are in that territory, so they are a haulier’s job, not a tow-it-yourself one. Rules differ by country, so confirm with the road authority.',
        'Length matters too. A boat folded to 9.99 m is longer than the 7 m trailer limit quoted above for vehicles up to 3,500 kg, so how much overhangs and how it is marked are questions to put to a trailer specialist. GOV.UK’s page states a load overhang limit only for heavier vehicles (3.05 m), so do not assume the lighter category has none.'
      ]
    },
    {
      heading: 'What does the boat plus trailer weigh, and what can you tow?',
      paragraphs: [
        'The first number to find is the maximum authorised mass (MAM) on the trailer plate, and the second is your car’s maximum towing weight or gross train weight. GOV.UK says the gross train weight on the VIN plate must not be exceeded and that, if the plate lists no train weight, the vehicle should not be used for towing.',
        'The builder’s dry weights are a starting point only. A 1,150 kg Dragonfly 25 on a trailer is a modest combination, but a loaded cruising boat and a braked trailer weigh more. A 2,100 kg Dragonfly 28 needs a tow car and trailer rated for the full combined weight, and the 3,900 kg Dragonfly 33 is above 3,500 kg before the trailer is added, which puts it outside ordinary car-towing limits. Weigh the boat as loaded for the trip, add the trailer’s tare weight, and compare the total with every plate rather than relying on a brochure figure.'
      ]
    },
    {
      heading: 'Which driving licence do you need?',
      paragraphs: [
        'In Great Britain, [GOV.UK](https://www.gov.uk/towing-with-car/licence-and-age-requirements) says that if you passed your test from 1 January 1997 you can tow a trailer up to 3,500 kg MAM (category BE), and DVLA will add BE to your licence at the next renewal if it is missing. Drivers who passed earlier can usually drive a vehicle and trailer with a combined MAM of up to 8,250 kg. Heavier combinations need C1+E.',
        'Under the EU licence framework, as summarised by the [German federal transport ministry](https://bmdv.bund.de/SharedDocs/EN/Articles/StV/Roadtraffic/driving-licence-categories-overview.html), category B alone covers a trailer up to 750 kg, or a heavier one if the combination does not exceed 3,500 kg. Category BE covers a trailer over 750 kg up to 3,500 kg, and code 96 extends a B licence to combinations up to 4,250 kg. Whether code 96 needs a test varies by country. A Dragonfly 28 on a trailer will usually take you beyond the B-only limit, so check your own entitlement before you buy a boat you plan to tow, and do not rely on a seller’s advice.',
        'Also check towing speed limits: in Great Britain, [GOV.UK](https://www.gov.uk/speed-limits) lists 50 mph on single carriageways and 60 mph on dual carriageways and motorways for a car towing a trailer.'
      ]
    },
    {
      heading: 'How do you handle the mast?',
      paragraphs: [
        'The mast is the awkward part of road transport. The builder’s mast section is 10.60 m (aluminium) or 11.90 m (carbon) on the Dragonfly 25, against a folded boat length of 8.95 m. On the Dragonfly 28 the section is 12.10 m or 13.60 m, against 9.99 m or 10.40 m folded length. In other words, the mast is longer than the folded hull, so it has to be carried with some overhang or supported on the boat in a way that is safe and compliant. Ask the seller to show you exactly how the mast travels, and take photographs.',
        'Raising and lowering the mast is also the highest-risk step at launch. The [RYA](https://www.rya.org.uk/water-safety/boat-safety-and-maintenance/overhead-wires/) warns that people have been killed or injured when a mast touched overhead power lines, and [Western Power](https://westernpower.co.uk/customers-and-community/health-and-safety/sailing-safety) says most such incidents happen while boats are rigged or moved on land. Look up before you start, walk the route, and use a second person. If you are in doubt about clearance, leave the mast down.'
      ]
    },
    {
      heading: 'How do you launch and recover safely?',
      paragraphs: [
        'The builder’s handbook for your model is the authority on the order of work, so follow it rather than a generic routine. The sequence below is general practice, not a substitute.'
      ],
      bullets: [
        'Check the ramp first: gradient, surface, tide, and whether the operator allows multihulls and trailer launching.',
        'Prepare the boat away from the ramp: mast up, rig checked, floats unfolded and locked, so you do not block others.',
        'Use a second person at the front and the back during reversing, and keep clear of the trailer when the boat releases.',
        'Rinse the trailer and brakes after salt water, and check bearings and lights before the next trip.',
        'Recover in the reverse order: fold the floats fully, secure the folding gear, lower the mast and strap everything down before you pull out of the water.'
      ]
    },
    {
      heading: 'Pre-trip checklist for towing a folded trimaran',
      paragraphs: [
        'Use this before every road trip. It supplements the cross-border and cost points in our general [sailboat transport guide](/blog/sailboat-transport-guide) and in [boat transport cost](/blog/boat-transport-cost).'
      ],
      bullets: [
        'Measure the widest point of the loaded trailer and compare it with 2.55 m.',
        'Compare the total weight with the car’s towing limit, the trailer plate and your licence entitlement.',
        'Confirm that the boat’s insurance covers road transit and that the trailer is roadworthy, as insurers can make that a condition ([MBY, citing N&G](https://www.mby.com/news/laying-up-advice-from-ng-12624)).',
        'Check tyres, bearings, brakes, coupling, lights and number plate.',
        'Secure the folding gear, the mast, the boom and loose items, and remove or strap down the sails.',
        'Plan the route for height, width and low bridges, and note fuel and rest stops.'
      ]
    },
    {
      heading: 'What if the boat is too big or too wide to tow?',
      paragraphs: [
        'For the 33, 36 and 40, or any boat that fails the weight or licence test, hire a transporter and let them handle the notification. If you are looking for a boat you can realistically tow, start with the smaller models in the [3Hulls listings](/forsale) and check the folded beam and trailer details in each advert.'
      ]
    }
  ]
};
