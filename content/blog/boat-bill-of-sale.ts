import type { BlogPost } from '@/utils/blog-types';

export const post: BlogPost = {
  slug: 'boat-bill-of-sale',
  title: 'Boat Bill of Sale: What to Include and How It Works in the UK',
  description:
    'What a boat bill of sale contains, how it relates to UK registration and VAT evidence, plus a template skeleton. General information, not legal advice.',
  primaryKeyword: 'boat bill of sale',
  cluster: 'selling',
  keywords: ['bill of sale for a boat', 'transfer of boat ownership', 'boat sale agreement'],
  publishedAt: '2026-12-19',
  updatedAt: '2026-11-08',
  readingMinutes: 7,
  intro:
    'A boat bill of sale is the signed document that records the sale of a boat from the seller to the buyer: who they are, which boat it is, the price, and the date ownership passes. It is the buyer’s main evidence of title and, for a registered boat, one of the documents needed to change the register. This guide explains what it should contain, how it works with UK registration and VAT evidence, and offers a skeleton you can adapt. It is general information, not legal advice, and rules differ between countries, so check with the registry or a professional for your own sale.',
  sections: [
    {
      heading: 'What is a boat bill of sale for?',
      paragraphs: [
        'It does three jobs. It records the agreement between seller and buyer, it gives the buyer proof that they acquired the boat from the person who owned it, and it supplies the paperwork that registries and later buyers will ask for. In the UK, the Maritime and Coastguard Agency says that [a buyer does not obtain complete title until an appropriate bill of sale has been recorded](https://www.gov.uk/government/publications/bill-of-sale-msf-4705) and a new certificate issued, for a British registered ship. For an unregistered boat there is no register to update, but the bill of sale still matters as the chain of ownership.',
        'It is separate from the wider sales process. For the order of events from price to handover, see [how to sell your boat](/blog/how-to-sell-your-boat). This article concentrates on the document itself.'
      ]
    },
    {
      heading: 'What should a boat bill of sale contain?',
      paragraphs: [
        'There is no single universal form, and the exact wording depends on the country and the register. The elements below are the ones most bills of sale cover, and a registry form will specify its own required fields, so use the registry’s form where one exists.'
      ],
      bullets: [
        '**The parties:** full legal names and addresses of seller and buyer, and their company details if either is a company. Where there are joint owners, every owner should appear and sign.',
        '**The boat:** name, make and model, year, hull identification number or builder’s number, registration or official number if any, length, and the engine and its serial number. For a trimaran, state whether the trailer, cradle and folding hardware are included.',
        '**The price and currency,** how and when it was paid, and the date of the sale.',
        '**What is included:** sails, tender, outboard, electronics, covers and spares, ideally by reference to an attached inventory.',
        '**Title and encumbrances:** a statement by the seller that they are the owner and that the boat is free of mortgages, liens or debts, or a list of any that exist and how they will be cleared.',
        '**Condition and sale terms:** whether the boat is sold as seen, with or without a survey, and any agreed conditions such as a sea trial or a defect to be corrected.',
        '**Signatures and dates,** and a witness where the form requires one.'
      ]
    },
    {
      heading: 'How does a bill of sale work with UK registration?',
      paragraphs: [
        'The answer depends on how the boat is registered. On Part 1 of the UK Ship Register, the [UK Ship Register change of ownership page](https://ukshipregister.co.uk/registration/pleasure-part-1/change-ownership) lists the documents needed: the MCA Bill of Sale (form MSF 4705) from the current registered owner or owners to the new owner or owners, and a Declaration of Eligibility (form MSF 4727). If the new owner is a company, a copy of its certificate of incorporation is needed, and probate is needed if a registered owner has died.',
        'The same page says the registration fee is £105, paid online, and covers five years. Documents must be printed and signed, because digital signatures are not accepted, and documents not in English need a notarised translation. Ownership transfers could not be completed through the online service at the time of writing, so the documents are emailed to the registry or posted. Fees, forms and procedures change, so check the page before you file.',
        'Small boats on the Small Ships Register (Part 3) have their own process; the registry’s guidance for a new registration there lists a bill of sale (MSF 4705) or another document confirming ownership among the documents. A separate point: that register does not by itself prove ownership, which is why a bill of sale matters even for a small boat.'
      ]
    },
    {
      heading: 'What about boats registered elsewhere in the EU?',
      paragraphs: [
        'Each country sets its own registration and transfer rules, and some use notarised documents, local forms or a registry fee that depends on the boat. Do not assume the UK process applies. Ask the registering authority in the boat’s country what it requires, and if the boat is moving between countries, consider the requirements of both. Where the paperwork is in another language, plan for translation.',
        'If you are buying across borders, the guides on [buying a boat in Europe](/blog/buy-a-boat-in-europe) and [buying a boat from the UK, VAT and customs](/blog/buy-a-boat-from-the-uk-vat-customs) cover the wider issues. The bill of sale is only one part of a cross-border transaction.'
      ]
    },
    {
      heading: 'How does a bill of sale relate to VAT evidence?',
      paragraphs: [
        'They are not the same thing. A bill of sale records a transfer of ownership and price. VAT evidence shows that VAT was paid on the boat at some point, or that it was otherwise treated as VAT-paid, and that is usually shown by documents such as the original VAT invoice. A bill of sale between private individuals should not be treated as proof that VAT was paid.',
        'The [Boatshed knowledge base](https://www.boatshedsupport.com/article/12-vat-evidence) says evidence will generally be an invoice showing the VAT element and a VAT number, or a similar document such as a completion statement. It notes that some EU states, notably Holland, ask for the original, whereas elsewhere a certified copy kept on board should be adequate, and it advises keeping a couple of certified copies in a separate place. Pass the VAT documents to the buyer with the boat, and keep copies of every earlier bill of sale and invoice in the chain. For rules in your situation, check HMRC’s guidance for boats (VAT Notice 8) and seek specialist advice, because the position can turn on where the boat has been kept and its history.'
      ]
    },
    {
      heading: 'Template skeleton: general information, not legal advice',
      paragraphs: [
        'The skeleton below is a layout to help you prepare, not a legal document. It has not been reviewed by a lawyer, it will not suit every country or register, and if your boat is registered you should use the registry’s official form (for Part 1 in the UK, MSF 4705) instead. Adapt it, and have a professional check it if the sale is valuable or complicated.'
      ],
      bullets: [
        'Title: “Bill of Sale for a boat”. Date of sale: [date].',
        'Seller: [full name, address, contact]. Buyer: [full name, address, contact].',
        'Boat: [make and model], year [year], hull number [number], registration or official number [number or “unregistered”], length [length], engine [make, model, serial number].',
        'Included equipment: see attached inventory dated [date], including sails, tender, outboard, trailer or cradle.',
        'Price: [amount and currency], paid by [method] on [date]. Deposit of [amount] received on [date], if any.',
        'Seller’s statement: the seller is the sole owner [or: owners are listed], has the right to sell, and the boat is free of mortgages, liens and debts [or: the following exist and will be cleared by [date]].',
        'Condition: sold [as seen / subject to the following conditions: ...]. Survey report dated [date] [attached / not provided].',
        'VAT: documents supplied on handover: [list, for example original VAT invoice or other evidence].',
        'Handover: date, place and engine hours [number]. Delivery of keys, manuals and documents.',
        'Signatures: seller [signature, date]. Buyer [signature, date]. Witness [name, signature] if required.'
      ]
    },
    {
      heading: 'What should you do on the day and afterwards?',
      paragraphs: [
        'Check that the names on the bill of sale match the identity documents and the registration papers, that the hull number on the boat matches the paperwork, and that funds have cleared before you sign over the boat and hand the documents to the buyer. Use the [safe payment guide](/blog/boat-scams-safe-payment) if the buyer is paying remotely. Make two signed originals or copies, one for each party, and photograph the signed document along with the engine hours.',
        'Afterwards, the buyer files the registration documents with the registry, and the seller cancels or transfers insurance, mooring or storage arrangements, and any trailer contracts. Within the UK Ship Register process, keep a copy of what you submitted. If a buyer or seller disagrees later about what was included, a clear inventory attached to the bill of sale is the best protection.',
        'If you are still preparing to sell, you can [list your boat](/list-boat) when the paperwork is ready, and buyers can browse the current [boats for sale](/forsale). For the buyer’s side of the process, the [how to buy a boat](/blog/how-to-buy-a-boat) guide gives the full sequence.'
      ]
    }
  ]
};
