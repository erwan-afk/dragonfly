'use client';

import { useState } from 'react';

export default function UsefulLinkPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sections = [
    {
      id: 'cooker-heater',
      title: 'Cooker / Heater',
      cards: [
        {
          title: 'Wallas Heaters',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.wallas.fi\nUK: www.kuranda.co.uk',
          description:
            'Specialist in diesel heaters and cookers for boats. Compact and efficient solutions for the tight spaces of multihulls.'
        },
        {
          title: 'Eberspacher',
          contact: 'UK: www.eberspacher.com',
          description:
            'and all the UK Eberspacher dealers are listed on this page <a href="www.eberspacher.com/dealers">…www.eberspacher.com/dealers<a>'
        },
        {
          title: 'Dickinson Marine',
          contact:
            'Tel: +1 250 478 9631\nWebsite: www.dickinsonmarine.com\nCanada: Victoria, BC',
          description:
            'Manufacturer of marine stoves and heaters since 1932. Robust and reliable solutions for offshore sailing.'
        }
      ]
    },
    {
      id: 'crockery',
      title: 'Crockery',
      cards: [
        {
          title: 'Navigare Vivere Est',
          contact:
            'Tel: +44 1663 7348 00\nSVB: www.svb.de/de/geschirr-navigare\nUK: www.kuranda.co.uk',
          description:
            'As supplied originally with the Dragonfly by Quorning can be bought in Europe through mail order (or in their shops in Germany).'
        },
        {
          title: 'Melamine Warehouse',
          contact:
            'Tel: +44 1202 677 939\nWebsite: www.melamine-warehouse.co.uk\nUK: Poole, Dorset',
          description:
            'Specialist in marine melamine tableware. Wide range of unbreakable products suited for sailing.'
        },
        {
          title: 'Marine Tableware',
          contact:
            'Tel: +33 2 97 55 85 15\nWebsite: www.marine-tableware.fr\nFrance: Vannes',
          description:
            'French manufacturer of marine tableware. Durable and elegant products for your saloon.'
        }
      ]
    },
    {
      id: 'deck-fitting-rigging',
      title: 'Deck fitting / Rigging',
      cards: [
        {
          title: 'Seascrew',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.seascrew.com\nUK: www.kuranda.co.uk',
          description:
            'Dome headed bolts that connect the beam hinges to the beams/hull. You need A4 or 316 and search for carriage bolt. These have the square section in the shaft of the bolt under the head.'
        },
        {
          title: 'Z Spars',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.zsparsuk.com\nUK: www.mailspeedmarine.com',
          description:
            'The boom on the standard 920 is made by Z Spars, as are some of the fittings including the end castings and the main sheet attachment points. The end castings have part numbers cast into them. From this part number Z Spars can identify which boom system you have and supply spare parts.'
        },
        {
          title: 'Torlon balls',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.winchservicing.com\nUK: www.accu.co.uk',
          description:
            "Torlon balls used in Frederiksen/Ronstan batten cars are very expensive if bought from Ronstan. This company sells packs of 100 at a quarter of Ronstan's price. They sell more sizes than they list on their website. Call them for details. Their website is in Dutch and English."
        },
        {
          title: 'Gebo Portlights',
          contact:
            'Tel: +44 1663 7348 00\nManufacturer: www.boomsma.com\nUK: www.mailspeedmarine.com',
          description:
            'Their website is in Dutch and English. Contact manufacturer for suppliers in other countries.'
        }
      ]
    },
    {
      id: 'electrical',
      title: 'Electrical',
      cards: [
        {
          title: 'Wallas Heaters',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.wallas.fi\nUK: www.kuranda.co.uk',
          description:
            'Other countries\' distributors are on the above Wallas website. For instruction on the correct usage of the Wallas diesel cooker see <a href="wallas_diesel.htm">User Forum: wallas_diesel.htm</a>'
        },
        {
          title: 'Wallas Cookers',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.wallas.fi\nUK: www.kuranda.co.uk',
          description:
            'Other countries\' distributors are on the above Wallas website. For instruction on the correct usage of the Wallas diesel cooker see <a href="wallas_diesel.htm">User Forum: wallas_diesel.htm</a>'
        },
        {
          title: 'Wallas Marine Systems',
          contact:
            'Tel: +44 1663 7348 00\nWebsite: www.wallas.fi\nUK: www.kuranda.co.uk',
          description:
            'Other countries\' distributors are on the above Wallas website. For instruction on the correct usage of the Wallas diesel cooker see <a href="wallas_diesel.htm">User Forum: wallas_diesel.htm</a>'
        }
      ]
    },
    {
      id: 'paint-sealant',
      title: 'Paint / Sealant',
      cards: [
        {
          title: 'International Paint',
          contact:
            'Tel: +44 1962 717 001\nWebsite: www.international-pc.com\nUK: Southampton',
          description:
            'World leader in marine paints. Antifouling and protection systems for all types of boats.'
        },
        {
          title: 'Sika Marine',
          contact:
            'Tel: +41 58 436 40 40\nWebsite: www.sika.com/marine\nSwitzerland: Baar',
          description:
            "Specialist in marine sealants and adhesives. High-performance sealing and bonding solutions."
        },
        {
          title: 'Awlgrip',
          contact:
            'Tel: +1 401 253 4200\nWebsite: www.awlgrip.com\nUSA: Rhode Island',
          description:
            'Premium marine paints. Professional finishes for yachts and prestige boats.'
        }
      ]
    },
    {
      id: 'sprayhood-tent',
      title: 'Sprayhood / Tent',
      cards: [
        {
          title: 'Sunbrella',
          contact:
            'Tel: +1 336 221 2211\nWebsite: www.sunbrella.com\nUSA: Glen Raven, NC',
          description:
            'Manufacturer of technical marine fabrics. UV and weather-resistant canvas for sprayhoods and covers.'
        },
        {
          title: 'Stamoid',
          contact:
            'Tel: +33 4 94 19 10 47\nWebsite: www.stamoid.com\nFrance: Cogolin',
          description:
            'French specialist in technical marine fabrics. High-performance materials for marine upholstery.'
        },
        {
          title: 'Oceanair',
          contact:
            'Tel: +44 1329 239 400\nWebsite: www.oceanair.co.uk\nUK: Fareham',
          description:
            "British manufacturer of marine upholstery equipment. Sprayhoods, covers and interior fittings."
        }
      ]
    },
    {
      id: 'skin-fitting-seacool',
      title: 'Skin fitting / Seacool',
      cards: [
        {
          title: 'Trudesign',
          contact:
            'Tel: +64 9 415 9782\nWebsite: www.trudesign.com\nNew Zealand: Auckland',
          description:
            'New Zealand manufacturer of composite skin fittings. Innovative and durable solutions for multihulls.'
        },
        {
          title: 'Groco',
          contact:
            'Tel: +1 410 604 3800\nWebsite: www.groco.net\nUSA: Annapolis, MD',
          description:
            'American specialist in hull equipment. Skin fittings, seacocks and cooling systems.'
        },
        {
          title: 'Seacock Solutions',
          contact:
            'Tel: +44 1489 885 400\nWebsite: www.seacock.co.uk\nUK: Southampton',
          description:
            'British manufacturer of seacocks and accessories. Reliable solutions for marine safety.'
        }
      ]
    },
    {
      id: 'toilets',
      title: 'Toilets',
      cards: [
        {
          title: 'Jabsco',
          contact: 'Tel: +44 1202 816 000\nWebsite: www.jabsco.com\nUK: Poole',
          description:
            'World leader in marine toilets. Manual and electric systems for all types of boats.'
        },
        {
          title: 'Raritan',
          contact:
            'Tel: +1 856 825 4900\nWebsite: www.raritaneng.com\nUSA: Millville, NJ',
          description:
            'American manufacturer of toilets and water treatment systems. Eco-friendly and high-performance solutions.'
        },
        {
          title: 'Tecma',
          contact:
            'Tel: +39 0321 956 133\nWebsite: www.tecma.com\nItaly: Novara',
          description:
            'Italian specialist in electric marine toilets. Compact and quiet systems for yachts.'
        }
      ]
    },
    {
      id: 'water-stays',
      title: 'Water stays',
      cards: [
        {
          title: 'Dyform',
          contact:
            'Tel: +44 1489 581 696\nWebsite: www.dyform.com\nUK: Southampton',
          description:
            'British manufacturer of cables and rigging. High-performance shrouds and stays for multihulls.'
        },
        {
          title: 'Loos & Co',
          contact:
            'Tel: +1 203 348 2211\nWebsite: www.loosco.com\nUSA: Pomfret, CT',
          description:
            'American specialist in stainless steel cables and rigging accessories. Solutions for standing and running rigging.'
        },
        {
          title: 'Structural Rigging',
          contact:
            'Tel: +44 1489 570 770\nWebsite: www.structural-rigging.com\nUK: Hamble',
          description:
            "British expert in custom rigging. Design and manufacture of stays and shrouds for multihulls."
        }
      ]
    }
  ];

  const handleMenuClick = (sectionId: string) => {
    setIsMenuOpen(false);
    // Petit délai pour permettre la fermeture du menu avant le scroll
    setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="w-full bg-fullwhite">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-40 lg:gap-[80px] pb-64 lg:pb-[128px] px-16 xl:px-0">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-0 justify-between items-start md:items-center">
          <h1 className="text-oceanblue text-32 lg:text-56">
            <span className="text-articblue">Spare parts</span> directory
          </h1>
        </div>

        <div className="flex flex-col xl:flex-row gap-40 xl:gap-[80px] relative">
          {/* Menu sticky sur la gauche pour grands écrans */}
          <div className="hidden xl:block w-[280px] flex-shrink-0">
            <div className="sticky top-[128px]">
              <nav className="bg-articblue rounded-[12px] p-6">
                <ul className="flex flex-col gap-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block px-4 py-3 text-fullwhite hover:bg-fullwhite/10 rounded-[8px] transition-colors text-16 font-medium"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* Menu déroulant pour petits écrans */}
            <div className="xl:hidden mb-8">
              <div className="bg-lightgrey rounded-[12px] p-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-articblue text-20 font-medium">
                    Browse sections
                  </span>
                  <svg
                    className={`w-5 h-5 text-articblue transition-transform ${
                      isMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="mt-4 border-t border-articblue/20 pt-4">
                    <nav>
                      <ul className="flex flex-col gap-2">
                        {sections.map((section) => (
                          <li key={section.id}>
                            <button
                              onClick={() => handleMenuClick(section.id)}
                              className="block w-full text-left px-4 py-3 text-oceanblue hover:bg-articblue/10 rounded-[8px] transition-colors text-16 font-medium"
                            >
                              {section.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-40 lg:gap-[80px]">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-[20px] w-full"
                >
                  <h2 className="text-oceanblue text-24 lg:text-40 font-light mb-8">
                    {section.title}
                  </h2>

                  <div
                    className={`gap-6 ${
                      section.cards.length > 3
                        ? 'flex flex-col lg:flex-row overflow-x-auto pb-4 max-w-full lg:max-w-[900px]'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {section.cards.map((card, index) => (
                      <div
                        key={index}
                        className={`bg-lightgrey rounded-12 p-6 ${
                          section.cards.length > 3
                            ? 'w-full lg:w-[300px] flex-shrink-0'
                            : 'w-full'
                        }`}
                      >
                        <h3 className="text-articblue text-24 lg:text-32 font-medium mb-4">
                          {card.title}
                        </h3>

                        <div className="text-oceanblue font-medium mb-4 whitespace-pre-line text-16">
                          {card.contact}
                        </div>

                        <p
                          className="text-darkgrey text-16 font-light leading-relaxed [&_a]:text-oceanblue [&_a]:underline [&_a:hover]:text-articblue [&_a]:transition-colors"
                          dangerouslySetInnerHTML={{ __html: card.description }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
