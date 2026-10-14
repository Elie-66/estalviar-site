// Estalviar legal texts — English translation (the French version prevails).
import { DATE_MISE_A_JOUR_EN, PRESTATAIRES } from "../infosLegales";
import { POINTS_NEWSLETTER } from "../newsletter";
import { REGLES_CASHBACK } from "../cashback";
import { JOURS_AVANT_RAPPEL } from "../rappelsAnniversaire";

const MAJ = `Last updated: ${DATE_MISE_A_JOUR_EN}`;
const R = REGLES_CASHBACK;

/* =====================================================================
   TERMS AND CONDITIONS OF SALE
   ===================================================================== */
export const cgv = {
  titre: "Terms and conditions of sale",
  miseAJour: MAJ,
  sommaireLabel: "Contents",
  intro: [
    "These terms and conditions of sale (the \"Terms\") apply to all orders placed by consumers on estalviar.com (the \"Site\"). Please read them carefully: by placing an order, you accept them.",
  ],
  sections: [
    {
      id: "vendeur",
      titre: "1. Who we are",
      blocs: [
        "The Site is operated by {{nom}}, {{statut}}, under the Estalviar brand.",
        {
          liste: [
            "Address: {{adresse}}",
            "SIRET: {{siret}} — {{rcs}}",
            "{{tva}}",
            "Email: [info@estalviar.com](mailto:info@estalviar.com) — Phone: {{telephone}}",
          ],
        },
        "Hereinafter \"Estalviar\", \"we\".",
      ],
    },
    {
      id: "champ",
      titre: "2. Scope",
      blocs: [
        "These Terms cover the sale of digital gift cards, group gifts (\"Cagnottes\"), customer accounts, the loyalty programme (points, tiers and cashback) and the use of partner codes.",
        "They apply to consumers, i.e. individuals buying for personal purposes. To order, you must be of legal age or have your legal guardians' permission. Businesses, works councils (CSE) and associations order on quotation via the [Business](/professionnels) page; the specific conditions of the quotation then prevail.",
        "The version applicable to your order is the one in force when you confirm it. It is recorded with your order, and you can save or print it at any time.",
      ],
    },
    {
      id: "definitions",
      titre: "3. Definitions",
      blocs: [
        {
          liste: [
            "**Gift card**: a prepaid voucher issued by a retailer (the \"Brand\") for a set amount, usable to pay for purchases from that Brand. It takes the form of a code (sometimes with a PIN or a link) sent by email.",
            "**Buyer**: the person who places and pays for the order.",
            "**Recipient**: the person the card is intended for. This may be the Buyer.",
            "**Cagnotte**: an online collection set up by an \"Organiser\" to which several \"Contributors\" contribute, the total of which is converted into gift card(s) for a Recipient.",
            "**Account**: a free personal space created on the Site.",
            "**Points**, **Tiers** and **Cashback**: loyalty programme benefits described in articles 12 and 13.",
          ],
        },
      ],
    },
    {
      id: "cartes",
      titre: "4. Gift cards",
      blocs: [
        "Estalviar is a reseller: gift cards are **issued by the Brands**, and we purchase them from suppliers they have approved. The Brand alone is responsible for accepting the card in its stores and on its website.",
        "Each card is subject to **its Brand's terms of use**: validity period, use in store and/or online, single or multiple use, countries, excluded products. Available information is shown on each Brand's page. If in doubt, contact us **before** buying.",
        "Unless the Brand's terms say otherwise, a gift card cannot be refunded or exchanged for cash or for another Brand's card.",
        "Personalisation (name, message, design, sending date) only affects the presentation of the email sent: it does not change the value or the terms of the card. You are responsible for the content of your message, which must not be offensive, unlawful or infringe the rights of others.",
        "Available amounts (minimum, maximum, fixed values) depend on each Brand. Brand names and logos belong to their owners: their presence on the Site does not imply any official partnership unless stated otherwise.",
      ],
    },
    {
      id: "commande",
      titre: "5. Ordering",
      blocs: [
        "To order: choose a Brand and an amount, personalise the card, add it to your basket, then enter your email address and, if you wish, the Recipient's. You can order with or without an Account.",
        "Before paying, a summary lets you check and correct your order (cards, amounts, addresses, sending dates, total price). You then tick the box by which you accept the Terms and ask for the cards to be sent without waiting for the end of the withdrawal period (see article 8), and you pay.",
        "The contract is concluded as soon as payment is confirmed. A confirmation email is sent to you.",
        "We may refuse or cancel an order in the event of suspected fraud, failed payment, unusual order (unusual amounts or quantities) or unavailability of the card from our supplier. You are then refunded in full.",
      ],
    },
    {
      id: "prix",
      titre: "6. Prices and payment",
      blocs: [
        "Prices are shown in euros. The price of a card equals its value: a €50 card costs €50. **No service or delivery fee** is added. {{tva}}.",
        "Payment is made online when ordering, using the methods offered on the payment page (including bank card). It is processed by our provider Stripe on a secure page: Estalviar never receives or stores your card details.",
        "Part of the price may be paid with your Cashback (article 13). A partner code does not reduce the price: it gives entitlement to Cashback (article 14).",
        "Proof of payment is available on request at [info@estalviar.com](mailto:info@estalviar.com).",
      ],
    },
    {
      id: "livraison",
      titre: "7. Sending the cards",
      blocs: [
        "Cards are sent **by email only**, to the Recipient's address if you entered one, otherwise to yours:",
        {
          liste: [
            "**immediately**: usually within a few minutes of payment;",
            "**on the date and at the time chosen** (Paris time) if you scheduled the sending, up to one year in advance.",
          ],
        },
        "Please check the email addresses carefully: the card is sent to the address entered and, once sent, its code can be used by anyone who holds it. Remember to check spam folders.",
        "If a card has not arrived, write to [info@estalviar.com](mailto:info@estalviar.com) with the address used for the order: we will check the sending and resend the card. An address error on your part cannot lead to a refund if the code has already been used.",
      ],
    },
    {
      id: "retractation",
      titre: "8. Right of withdrawal",
      blocs: [
        "As a rule, you have **14 days** from the conclusion of the contract to withdraw, without giving any reason.",
        "**Exception:** a gift card code can be used as soon as it is received. In accordance with article L.221-28 of the French Consumer Code, when you expressly request, at the time of ordering, that the card be sent before the end of the withdrawal period and acknowledge that you will lose your right of withdrawal, **this right can no longer be exercised once the card has been sent**.",
        "You can therefore withdraw **as long as the card has not been sent**, within 14 days of the order. This applies in particular to a card scheduled for a later date.",
        "**How?** Use our [online withdrawal form](/retractation), available without an Account. You can also send us the model form in article 23, or any unambiguous statement, by email or post. An acknowledgement of receipt is sent to you by email.",
        "We refund all sums paid for the card concerned **within 14 days** of receiving your request, using the payment method used for the order. Any part paid with Cashback is returned as Cashback. Points and Cashback earned on the cancelled order are removed.",
      ],
    },
    {
      id: "utilisation",
      titre: "9. Codes, loss and cards that do not work",
      blocs: [
        "A gift card code is worth the same as cash: keep it confidential. Estalviar cannot replace a card that is lost, stolen or used by a third party after it has been sent to the address entered when ordering.",
        "If a code does not work (refused, already used, incorrect balance), contact us as soon as possible with your order address. We check with our supplier and the Brand: if the card is defective and has not been used, we replace it or refund you.",
        "We do not control the Brands' websites and stores. Complaints about products bought with the card should be addressed to the Brand.",
      ],
    },
    {
      id: "cagnottes",
      titre: "10. Group gifts (Cagnottes)",
      blocs: [
        "The Organiser creates the Cagnotte: Recipient, message, target (or open amount), end date, and whether the card is chosen by the Organiser or by the Recipient. The Organiser is responsible for the information entered and for the people the link is shared with.",
        "Each Contributor pays their contribution online under the conditions of article 6. Paying a contribution means accepting these Terms.",
        "On the end date, the Cagnotte is closed and **the amount collected is converted into gift card(s)**, even if the target has not been reached. Depending on the Organiser's choice, the card is chosen by the Organiser or the Recipient receives a link to choose it, then the card is sent by email.",
        "A Contributor may withdraw and be refunded within 14 days of payment, **as long as the Cagnotte has not been closed**: after closing, the amount is converted into a card and article 8 applies.",
        "Contributions count towards the Points of a Contributor who has an Account, but do not earn Cashback.",
      ],
    },
    {
      id: "compte",
      titre: "11. Customer account",
      blocs: [
        "The Account is free. It lets you follow your orders and Cagnottes, save your recipients and their birthdays, and benefit from the loyalty programme. It is reserved for people aged 15 and over.",
        "You undertake to provide accurate information and to keep your password confidential. Any action carried out with your login details is deemed to be carried out by you.",
        "You can delete your Account at any time from My account › Security. Deletion results in the permanent loss of unused Points and Cashback.",
        "In the event of fraud, abuse (for example multiple accounts created to accumulate benefits) or breach of these Terms, we may suspend or close an Account and cancel Points and Cashback obtained improperly, after informing you.",
      ],
    },
    {
      id: "fidelite",
      titre: "12. Loyalty programme: points and tiers",
      blocs: [
        "The programme is free and reserved for Account holders. **Each euro paid earns 1 point**, including contributions to Cagnottes. Points are credited when payment is confirmed.",
        `When you first sign up to our emails (newsletter), you receive **${POINTS_NEWSLETTER} free points**, once per Account.`,
        "Your Points determine your Tier: **Bronze** from sign-up, **Silver** from 100 points, **Gold** from 300 points, **Platinum** from 700 points. Each Tier gives access to the benefits described on the [Loyalty](/fidelite) page.",
        "Points have no monetary value and cannot be transferred or refunded. They are removed if the corresponding order is cancelled or refunded.",
        "We may change the programme (Tiers, benefits). Significant changes are announced on the Site at least 30 days in advance; benefits already acquired (available or pending Cashback) are kept.",
      ],
    },
    {
      id: "cashback",
      titre: "13. Cashback",
      blocs: [
        "From the Silver Tier, your orders earn you Cashback: a credit in euros, usable only on the Site.",
        {
          liste: [
            "**Amount**: it depends on your Tier at the time of the order and on the Brand. Some Brands do not earn Cashback.",
            `**Availability**: Cashback appears as \"pending\" in your Account, then becomes usable **${R.joursAttente} days after the last card of the order is sent** (for a scheduled card, ${R.joursAttente} days after the chosen sending date).`,
            "**Validity**: each Cashback expires **12 months** after being credited. An email warns you 30 days beforehand.",
            `**Use**: on an order of at least **€${R.commandeMinimum}**, up to **${Math.round(R.plafondCommande * 100)}%** of the order amount.`,
            "An order paid, even partly, with Cashback earns Points but **no new Cashback**.",
            "Cashback cannot be refunded, exchanged for cash or transferred to another Account.",
            "It is cancelled if the order that generated it is cancelled or refunded.",
          ],
        },
      ],
    },
    {
      id: "codes",
      titre: "14. Partner codes",
      blocs: [
        "Codes may be shared by our partners (content creators in particular). A code is entered on the payment page and requires you to be logged in to an Account.",
        "A code does not reduce the price paid: it gives entitlement to **Cashback**, credited under the availability and validity rules of article 13. This Cashback **replaces** the Cashback linked to your Tier for that order (no combination). The order still earns Points.",
        "Each code has its own conditions, stated when it is shared or entered: validity period, number of uses, single use per customer, eligible Brands. One code per order; a code cannot be combined with the use of your Cashback.",
      ],
    },
    {
      id: "emails",
      titre: "15. Newsletter and birthday reminders",
      blocs: [
        "The newsletter (gift ideas, key occasions, offers) is only sent to people who asked for it. Each email contains an unsubscribe link.",
        `If you save a recipient's birthday in your Account, we send you an email reminder ${JOURS_AVANT_RAPPEL} days before. Simply remove the date to stop receiving it.`,
      ],
    },
    {
      id: "responsabilite",
      titre: "16. Liability",
      blocs: [
        "We do our best to keep the Site available and to send cards on time. Interruptions may nevertheless occur (maintenance, provider outage, email incident).",
        "We cannot be held liable in the event of force majeure, the act of a third party, or misuse of the Site or the card, in particular an error in the email address entered or disclosure of the code.",
        "Nothing in these Terms limits your statutory rights as a consumer.",
      ],
    },
    {
      id: "garanties",
      titre: "17. Legal guarantees",
      blocs: [
        "You benefit from the legal guarantee of conformity applicable to digital content (articles L.224-25-12 et seq. of the French Consumer Code): a card that does not work as described is replaced or refunded, as set out in article 9.",
      ],
    },
    {
      id: "propriete",
      titre: "18. Intellectual property",
      blocs: [
        "The Site, its content and the Estalviar brand are protected. Brand names and logos belong to their respective owners.",
      ],
    },
    {
      id: "donnees",
      titre: "19. Personal data",
      blocs: [
        "Data collected when you order is processed in accordance with our [privacy policy](/confidentialite). If you enter a Recipient's details, you confirm that they agree to receive their card by email.",
      ],
    },
    {
      id: "service-client",
      titre: "20. Customer service and complaints",
      blocs: [
        "For any question or complaint: [info@estalviar.com](mailto:info@estalviar.com), via the [Contact](/contact) page, by phone on {{telephone}}, or by post to {{adresse}}. We reply as quickly as possible, usually within 2 working days.",
      ],
    },
    {
      id: "mediation",
      titre: "21. Mediation",
      blocs: [
        "If a dispute could not be resolved after a written complaint to our customer service, you may refer it **free of charge** to the consumer mediator we are registered with (articles L.611-1 et seq. of the French Consumer Code):",
        { encadre: ["{{mediateurNom}}", "{{mediateurAdresse}}", "{{mediateurSite}}"] },
        "The mediator must be contacted within one year of your written complaint.",
      ],
    },
    {
      id: "droit",
      titre: "22. Applicable law and disputes",
      blocs: [
        "These Terms are governed by French law. Failing an amicable settlement, the dispute may be brought before the competent court, including that of your place of residence.",
        "We may amend these Terms at any time. The version applicable to your order remains the one you accepted when placing it.",
      ],
    },
    {
      id: "formulaire",
      titre: "23. Model withdrawal form",
      blocs: [
        "The easiest way is to use our [online form](/retractation). You can also complete and return this model, only if you wish to withdraw:",
        {
          encadre: [
            "To {{nom}} (Estalviar), {{adresse}}, [info@estalviar.com](mailto:info@estalviar.com):",
            "I hereby give notice that I withdraw from the contract for the sale of the gift card below:",
            "Ordered on: ………… — Brand and amount: …………",
            "Name of consumer: ………… — Email address used for the order: …………",
            "Date: ………… — Signature (only if this form is notified on paper): …………",
          ],
        },
      ],
    },
  ],
};

/* =====================================================================
   LEGAL NOTICE
   ===================================================================== */
export const mentions = {
  titre: "Legal notice",
  miseAJour: MAJ,
  sections: [
    {
      id: "editeur",
      titre: "Publisher",
      blocs: [
        "estalviar.com is published by {{nom}}, {{statut}}, trading as Estalviar.",
        {
          liste: [
            "Address: {{adresse}}",
            "SIRET: {{siret}}",
            "Registration: {{rcs}}",
            "{{tva}}",
            "Phone: {{telephone}}",
            "Email: [info@estalviar.com](mailto:info@estalviar.com)",
            "Publication director: {{directeurPublication}}",
          ],
        },
      ],
    },
    {
      id: "hebergement",
      titre: "Hosting",
      blocs: [
        `The site is hosted by ${PRESTATAIRES.hebergeurEn}.`,
        "Account and order data is hosted by Supabase, Inc. (www.supabase.com), on servers located in: {{regionDonnees}}.",
      ],
    },
    {
      id: "propriete",
      titre: "Intellectual property",
      blocs: [
        "The texts, visuals, design and the Estalviar brand are protected by intellectual property law. Any reproduction or reuse without prior written permission is prohibited.",
        "The brand names and logos of the retailers on the site belong to their respective owners. They are used to identify the gift cards offered and do not imply any official partnership unless stated otherwise.",
      ],
    },
    {
      id: "liens",
      titre: "Links",
      blocs: [
        "The site may contain links to other websites (retailers, social networks). Estalviar is not responsible for their content.",
      ],
    },
    {
      id: "donnees",
      titre: "Personal data and cookies",
      blocs: ["See our [privacy policy](/confidentialite) and our [cookie policy](/cookies)."],
    },
    {
      id: "contact",
      titre: "Contact",
      blocs: [
        "For any question about the site: [info@estalviar.com](mailto:info@estalviar.com) or the [Contact](/contact) page. Terms of sale: see the [Terms and conditions](/cgv).",
      ],
    },
  ],
};

/* =====================================================================
   PRIVACY POLICY
   ===================================================================== */
export const confidentialite = {
  titre: "Privacy policy",
  miseAJour: MAJ,
  sommaireLabel: "Contents",
  intro: [
    "This policy explains what data we collect, why, how long we keep it and how to exercise your rights, in accordance with the General Data Protection Regulation (GDPR) and the French Data Protection Act.",
  ],
  sections: [
    {
      id: "responsable",
      titre: "1. Data controller",
      blocs: [
        "{{nom}}, {{statut}} (Estalviar), {{adresse}}. Contact for any question about your data: [info@estalviar.com](mailto:info@estalviar.com).",
      ],
    },
    {
      id: "donnees",
      titre: "2. Data collected, purposes and legal bases",
      blocs: [
        {
          tableau: {
            entetes: ["Purpose", "Data", "Legal basis"],
            lignes: [
              ["Processing and sending your orders, resending them if needed", "Buyer's email, first name, recipient's email, message and personalisation, amounts, sending dates, card codes (encrypted)", "Performance of the contract"],
              ["Payment and fraud prevention", "Amount, payment identifier (card details are processed by Stripe, never by us), IP address", "Performance of the contract, legitimate interest (preventing fraud)"],
              ["Customer account", "Email, password (stored encrypted), username, first name, surname, phone, date of birth, gender, favourite brand and avatar if you provide them", "Performance of the contract"],
              ["Recipients and birthday reminders", "Name, email and birthday (day and month) of the people you save", "Performance of the contract (requested service)"],
              ["Loyalty programme, cashback, partner codes", "Points, tier, cashback transactions, codes used", "Performance of the contract"],
              ["Cagnottes", "Email of the organiser and contributors, name and message displayed, amounts", "Performance of the contract"],
              ["Newsletter", "Email, sign-up and confirmation dates", "Consent"],
              ["Quotation, contact and withdrawal requests", "Name, company, email, phone, content of the request", "Pre-contractual measures, legal obligation (withdrawal)"],
              ["Site security", "IP address and login or form submission attempts", "Legitimate interest (protecting the site and accounts)"],
              ["Accounting", "Orders and payments", "Legal obligation"],
            ],
          },
        },
        "Mandatory fields are indicated in the forms. Without them, we cannot process your request.",
      ],
    },
    {
      id: "tiers",
      titre: "3. Data about the people you buy for",
      blocs: [
        "When you enter a recipient's email or save someone in your account, you give us data about them. We use it only to send them their card or to send you your reminders, never for marketing. Please make sure they agree.",
      ],
    },
    {
      id: "destinataires",
      titre: "4. Who receives your data?",
      blocs: [
        "Your data is **never sold or rented**. It is accessible to Estalviar and to our technical providers, only as necessary for their tasks:",
        {
          liste: [
            "**Supabase**: database and customer accounts;",
            "**Netlify**: website hosting;",
            "**Stripe**: online payment and fraud prevention;",
            "**Resend**: sending emails (cards, confirmations, newsletter);",
            "**Tillo**: supply of gift cards (only the order information required is passed on).",
          ],
        },
        "We may also disclose data to the authorities where required by law.",
      ],
    },
    {
      id: "transferts",
      titre: "5. Transfers outside the European Union",
      blocs: [
        "Some providers (in particular Netlify, Stripe and Resend) are based in, or process data in, the United States. These transfers are governed by the EU–US Data Privacy Framework where the provider participates in it, and/or by the European Commission's standard contractual clauses.",
      ],
    },
    {
      id: "conservation",
      titre: "6. How long?",
      blocs: [
        {
          tableau: {
            entetes: ["Data", "Period"],
            lignes: [
              ["Customer account", "Until you delete it. An account inactive for 3 years may be deleted, after a warning email."],
              ["Orders, payments, invoices", "10 years (accounting obligation), archived"],
              ["Gift card codes", "Encrypted, kept with the order so they can be resent"],
              ["Newsletter without an account", "Until you unsubscribe, or 3 years without any interaction from you"],
              ["Contact and quotation requests", "3 years after the last exchange"],
              ["Withdrawal requests", "5 years (limitation period)"],
              ["Security logs (login attempts)", "12 months maximum"],
            ],
          },
        },
      ],
    },
    {
      id: "securite",
      titre: "7. Security",
      blocs: [
        "The site is only accessible over HTTPS. Gift card codes are encrypted in our database, access to data is restricted by strict rules (everyone sees only their own data) and passwords are never stored in plain text.",
      ],
    },
    {
      id: "droits",
      titre: "8. Your rights",
      blocs: [
        "You may at any time request **access** to your data, its **rectification**, **erasure** or **portability**, the **restriction** of processing, **object** to processing based on legitimate interest, **withdraw your consent** (newsletter) and set instructions on what happens to your data after your death.",
        "Write to [info@estalviar.com](mailto:info@estalviar.com) from your account's email address. We reply within one month. You can also edit your information and delete your account directly from My account.",
        "If you believe your rights have not been respected, you may lodge a complaint with the CNIL, the French data protection authority ([www.cnil.fr](https://www.cnil.fr)).",
      ],
    },
    {
      id: "prospection",
      titre: "9. Marketing emails",
      blocs: [
        "We only send you the newsletter if you asked for it (box in your account or homepage form, confirmed by email). You can unsubscribe at any time via the link at the bottom of each email or from your account. Emails related to your orders (confirmation, card delivery, cashback) are not marketing and are always sent.",
      ],
    },
    {
      id: "mineurs",
      titre: "10. Minors",
      blocs: [
        "Creating an account is reserved for people aged 15 and over. Purchases require being of legal age or having permission from one's legal guardians.",
      ],
    },
    {
      id: "cookies",
      titre: "11. Cookies",
      blocs: ["See our [cookie policy](/cookies)."],
    },
    {
      id: "modifications",
      titre: "12. Changes",
      blocs: [
        "This policy may change, in particular if we add a service. The update date is shown at the top of the page. In the event of a significant change, we will inform you by email or on the site.",
      ],
    },
  ],
};

/* =====================================================================
   COOKIE POLICY
   ===================================================================== */
export const cookies = {
  titre: "Cookie policy",
  miseAJour: MAJ,
  intro: [
    "A cookie (or tracker) is a small file saved by your browser. We also use the browser's \"local storage\", which works in the same way. Here is everything the site stores on your device.",
  ],
  sections: [
    {
      id: "liste",
      titre: "What we use",
      blocs: [
        "**Only trackers that are necessary for the site to work.** They are exempt from consent: without them, the basket and login would not work.",
        {
          tableau: {
            entetes: ["Name", "Purpose", "Duration"],
            lignes: [
              ["estalviar-panier", "Keep the contents of your basket", "Until you order or empty the basket"],
              ["estalviar-emails-beneficiaires", "Keep the emails entered during payment", "Deleted after the order"],
              ["sb-…-auth-token", "Keep you logged in to your account", "Until you log out"],
              ["NEXT_LOCALE", "Remember the language chosen", "1 year maximum"],
              ["estalviar-cookies-consentement", "Remember your choice in the cookie banner", "Until you delete it"],
            ],
          },
        },
        "When paying, you are redirected to **Stripe**'s secure page, which sets its own trackers needed for payment security and fraud prevention (see Stripe's policy).",
      ],
    },
    {
      id: "pas-de-pub",
      titre: "No advertising or audience measurement",
      blocs: [
        "We use **no advertising, social network or audience measurement cookies**. If we ever add any, they will only be set after your consent, via the cookie banner, and this page will be updated.",
      ],
    },
    {
      id: "gerer",
      titre: "Managing cookies",
      blocs: [
        "You can delete cookies and local storage from your browser settings. The site will then only partly work (basket emptied, logged out).",
        "Any question? [info@estalviar.com](mailto:info@estalviar.com)",
      ],
    },
  ],
};
