// Textes légaux d'Estalviar — version française (version de référence).
// Syntaxe : {{champ}} = valeur de src/lib/infosLegales.js, **gras**, [texte](/lien).
import { DATE_MISE_A_JOUR, PRESTATAIRES } from "../infosLegales";
import { POINTS_NEWSLETTER } from "../newsletter";
import { REGLES_CASHBACK } from "../cashback";
import { JOURS_AVANT_RAPPEL } from "../rappelsAnniversaire";

const MAJ = `Dernière mise à jour : ${DATE_MISE_A_JOUR}`;
const R = REGLES_CASHBACK;

/* =====================================================================
   CONDITIONS GÉNÉRALES DE VENTE
   ===================================================================== */
export const cgv = {
  titre: "Conditions générales de vente",
  miseAJour: MAJ,
  sommaireLabel: "Sommaire",
  intro: [
    "Les présentes conditions générales de vente (les « CGV ») s'appliquent à toutes les commandes passées sur le site estalviar.com (le « Site ») par des consommateurs. Merci de les lire attentivement : en passant commande, vous les acceptez.",
  ],
  sections: [
    {
      id: "vendeur",
      titre: "1. Qui sommes-nous ?",
      blocs: [
        "Le Site est exploité par {{nom}}, {{statut}}, sous la marque Estalviar.",
        {
          liste: [
            "Adresse : {{adresse}}",
            "SIRET : {{siret}} — {{rcs}}",
            "{{tva}}",
            "Email : [info@estalviar.com](mailto:info@estalviar.com) — Téléphone : {{telephone}}",
          ],
        },
        "Ci-après « Estalviar », « nous ».",
      ],
    },
    {
      id: "champ",
      titre: "2. Champ d'application",
      blocs: [
        "Les CGV encadrent la vente de cartes cadeaux numériques, l'organisation de cagnottes, le compte client, le programme de fidélité (points, paliers et cashback) et l'utilisation de codes partenaires.",
        "Elles s'adressent aux consommateurs, c'est-à-dire aux personnes physiques qui achètent à des fins personnelles. Pour commander, vous devez être majeur ou disposer de l'autorisation de vos représentants légaux. Les entreprises, comités sociaux et économiques (CSE) et associations commandent sur devis, depuis la page [Professionnels](/professionnels) : les conditions particulières du devis s'appliquent alors en priorité.",
        "La version applicable à votre commande est celle en vigueur au moment où vous la validez. Elle est enregistrée avec votre commande et vous pouvez l'enregistrer ou l'imprimer à tout moment.",
      ],
    },
    {
      id: "definitions",
      titre: "3. Définitions",
      blocs: [
        {
          liste: [
            "**Carte cadeau** : titre prépayé émis par une enseigne (l'« Enseigne »), d'un montant déterminé, utilisable pour régler des achats auprès de cette Enseigne. Elle prend la forme d'un code (et parfois d'un code PIN ou d'un lien) envoyé par email.",
            "**Acheteur** : la personne qui passe et paie la commande.",
            "**Bénéficiaire** : la personne à qui la carte est destinée. Ce peut être l'Acheteur lui-même.",
            "**Cagnotte** : collecte en ligne organisée par un « Organisateur » à laquelle plusieurs « Participants » contribuent, et dont le montant est converti en carte(s) cadeau(x) pour un Bénéficiaire.",
            "**Compte** : espace personnel gratuit créé sur le Site.",
            "**Points**, **Paliers** et **Cashback** : avantages du programme de fidélité décrits aux articles 12 et 13.",
          ],
        },
      ],
    },
    {
      id: "cartes",
      titre: "4. Les cartes cadeaux",
      blocs: [
        "Estalviar est un revendeur : les cartes cadeaux sont **émises par les Enseignes**, que nous achetons auprès de fournisseurs agréés par elles. L'Enseigne reste seule responsable de l'acceptation de la carte dans ses points de vente et sur son site.",
        "Chaque carte est soumise aux **conditions d'utilisation de son Enseigne** : durée de validité, utilisation en magasin et/ou en ligne, utilisation en une ou plusieurs fois, pays concernés, produits exclus. Les informations disponibles sont indiquées sur la fiche de chaque Enseigne. En cas de doute, écrivez-nous **avant** votre achat.",
        "Sauf conditions contraires de l'Enseigne, une carte cadeau n'est ni remboursable, ni échangeable contre de l'argent, ni contre une carte d'une autre Enseigne.",
        "La personnalisation (prénom, message, design, date d'envoi) sert uniquement à la présentation de l'email envoyé : elle ne change pas la valeur ni les conditions de la carte. Vous êtes responsable du contenu de votre message, qui ne doit être ni injurieux, ni illicite, ni porter atteinte aux droits d'autrui.",
        "Les montants proposés (minimum, maximum, montants fixes) dépendent de chaque Enseigne. Les logos et marques des Enseignes appartiennent à leurs propriétaires : leur présence sur le Site n'implique aucun partenariat officiel, sauf mention contraire.",
      ],
    },
    {
      id: "commande",
      titre: "5. Commande",
      blocs: [
        "Pour commander : vous choisissez une Enseigne et un montant, personnalisez la carte, l'ajoutez au panier, puis indiquez votre adresse email et, si vous le souhaitez, celle du Bénéficiaire. Vous pouvez commander avec ou sans Compte.",
        "Avant de payer, un récapitulatif vous permet de vérifier et corriger votre commande (cartes, montants, adresses, dates d'envoi, prix total). Vous cochez ensuite la case par laquelle vous acceptez les CGV et demandez l'envoi des cartes sans attendre la fin du délai de rétractation (voir article 8), puis vous payez.",
        "Le contrat est conclu dès la confirmation du paiement. Un email de confirmation vous est envoyé.",
        "Nous pouvons refuser ou annuler une commande en cas de suspicion de fraude, de paiement non abouti, de commande anormale (montants ou quantités inhabituels) ou d'indisponibilité de la carte chez notre fournisseur. Vous êtes alors remboursé intégralement.",
      ],
    },
    {
      id: "prix",
      titre: "6. Prix et paiement",
      blocs: [
        "Les prix sont indiqués en euros. Le prix d'une carte est égal à sa valeur : une carte de 50 € coûte 50 €. **Aucun frais de service ni frais d'envoi** n'est ajouté. {{tva}}.",
        "Le paiement se fait en ligne, au moment de la commande, par les moyens proposés sur la page de paiement (carte bancaire notamment). Il est traité par notre prestataire Stripe, sur une page sécurisée : Estalviar ne reçoit ni ne conserve jamais vos coordonnées bancaires.",
        "Une partie du prix peut être réglée avec votre Cashback (article 13). Un code partenaire ne réduit pas le prix : il donne droit à du Cashback (article 14).",
        "Un justificatif de paiement est disponible sur simple demande à [info@estalviar.com](mailto:info@estalviar.com).",
      ],
    },
    {
      id: "livraison",
      titre: "7. Envoi des cartes",
      blocs: [
        "Les cartes sont envoyées **uniquement par email**, à l'adresse du Bénéficiaire si vous l'avez indiquée, sinon à la vôtre :",
        {
          liste: [
            "**immédiatement** : en général en quelques minutes après le paiement ;",
            "**à la date et à l'heure choisies** (heure de Paris) si vous avez programmé l'envoi, jusqu'à un an à l'avance.",
          ],
        },
        "Vérifiez soigneusement les adresses email saisies : la carte est envoyée à l'adresse indiquée et, une fois envoyée, son code peut être utilisé par toute personne qui le détient. Pensez à consulter les courriers indésirables.",
        "Si une carte n'est pas arrivée, écrivez-nous à [info@estalviar.com](mailto:info@estalviar.com) avec l'adresse utilisée pour la commande : nous vérifions l'envoi et renvoyons la carte. Une erreur d'adresse de votre part ne peut pas donner lieu à remboursement si le code a déjà été utilisé.",
      ],
    },
    {
      id: "retractation",
      titre: "8. Droit de rétractation",
      blocs: [
        "En principe, vous disposez de **14 jours** à compter de la conclusion du contrat pour vous rétracter, sans avoir à vous justifier.",
        "**Exception :** le code d'une carte cadeau est utilisable dès sa réception. Conformément à l'article L.221-28 du Code de la consommation, lorsque vous demandez expressément, au moment de la commande, l'envoi de la carte avant la fin du délai de rétractation et reconnaissez perdre votre droit de rétractation, **ce droit ne peut plus être exercé une fois la carte envoyée**.",
        "Vous pouvez donc vous rétracter **tant que la carte n'a pas été envoyée**, dans la limite de 14 jours après la commande. C'est notamment le cas d'une carte programmée pour une date ultérieure.",
        "**Comment faire ?** Utilisez notre [formulaire de rétractation en ligne](/retractation), accessible sans compte. Vous pouvez aussi nous adresser par email ou par courrier le modèle de formulaire figurant à l'article 23, ou toute déclaration dénuée d'ambiguïté. Un accusé de réception vous est envoyé par email.",
        "Nous vous remboursons la totalité des sommes versées pour la carte concernée **au plus tard 14 jours** après réception de votre demande, avec le moyen de paiement utilisé lors de la commande. La part éventuellement réglée avec du Cashback est restituée sous forme de Cashback. Les Points et le Cashback gagnés grâce à la commande annulée sont retirés.",
      ],
    },
    {
      id: "utilisation",
      titre: "9. Codes, perte et carte qui ne fonctionne pas",
      blocs: [
        "Un code de carte cadeau a la même valeur que de l'argent liquide : gardez-le confidentiel. Estalviar ne pourra pas remplacer une carte perdue, volée ou utilisée par un tiers après son envoi à l'adresse indiquée lors de la commande.",
        "Si un code ne fonctionne pas (refusé, déjà utilisé, solde incorrect), contactez-nous dès que possible avec votre adresse de commande. Nous vérifions auprès de notre fournisseur et de l'Enseigne : si la carte est défectueuse et n'a pas été utilisée, nous la remplaçons ou vous remboursons.",
        "Nous ne contrôlons pas les sites et magasins des Enseignes. Les réclamations concernant les produits achetés avec la carte sont à adresser à l'Enseigne.",
      ],
    },
    {
      id: "cagnottes",
      titre: "10. Cagnottes",
      blocs: [
        "L'Organisateur crée la cagnotte : Bénéficiaire, message, objectif (ou montant libre), date de fin, et choix de la carte par lui-même ou par le Bénéficiaire. Il est responsable des informations saisies et des personnes avec qui il partage le lien.",
        "Chaque Participant paie sa participation en ligne, dans les conditions de l'article 6. Le paiement d'une participation vaut acceptation des CGV.",
        "À la date de fin, la cagnotte est clôturée et **le montant collecté est converti en carte(s) cadeau(x)**, même si l'objectif n'est pas atteint. Selon le choix de l'Organisateur, la carte est choisie par lui-même ou le Bénéficiaire reçoit un lien pour la choisir, puis la carte est envoyée par email.",
        "Un Participant peut se rétracter et être remboursé de sa participation dans les 14 jours suivant son paiement, **tant que la cagnotte n'est pas clôturée** : après la clôture, le montant est converti en carte et l'article 8 s'applique.",
        "Les participations comptent pour les Points du Participant qui a un Compte, mais ne donnent pas droit au Cashback.",
      ],
    },
    {
      id: "compte",
      titre: "11. Compte client",
      blocs: [
        "Le Compte est gratuit. Il permet de suivre vos commandes et cagnottes, d'enregistrer vos bénéficiaires et leurs anniversaires et de profiter du programme de fidélité. Il est réservé aux personnes de 15 ans et plus.",
        "Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Toute action réalisée avec vos identifiants est réputée faite par vous.",
        "Vous pouvez supprimer votre Compte à tout moment depuis la rubrique Mon compte › Sécurité. La suppression entraîne la perte définitive des Points et du Cashback non utilisés.",
        "En cas de fraude, d'abus (comptes multiples créés pour cumuler des avantages, par exemple) ou de non-respect des CGV, nous pouvons suspendre ou fermer un Compte et annuler les Points et le Cashback obtenus indûment, après vous en avoir informé.",
      ],
    },
    {
      id: "fidelite",
      titre: "12. Programme de fidélité : points et paliers",
      blocs: [
        "Le programme est gratuit et réservé aux titulaires d'un Compte. **Chaque euro payé rapporte 1 point**, y compris les participations à des cagnottes. Les Points sont crédités à la confirmation du paiement.",
        `En vous inscrivant pour la première fois à nos emails (newsletter), vous recevez **${POINTS_NEWSLETTER} points** offerts, une seule fois par Compte.`,
        "Vos Points déterminent votre Palier : **Bronze** dès l'inscription, **Argent** à partir de 100 points, **Or** à partir de 300 points, **Platine** à partir de 700 points. Chaque Palier donne accès aux avantages décrits sur la page [Fidélité](/fidelite).",
        "Les Points n'ont aucune valeur monétaire, ne sont ni cessibles ni remboursables. Ils sont retirés en cas d'annulation ou de remboursement de la commande correspondante.",
        "Nous pouvons faire évoluer le programme (Paliers, avantages). Les changements importants sont annoncés sur le Site au moins 30 jours à l'avance ; les avantages déjà acquis (Cashback disponible ou en attente) sont conservés.",
      ],
    },
    {
      id: "cashback",
      titre: "13. Cashback",
      blocs: [
        "À partir du Palier Argent, vos commandes vous rapportent du Cashback : un crédit en euros, utilisable uniquement sur le Site.",
        {
          liste: [
            "**Montant** : il dépend de votre Palier au moment de la commande et de l'Enseigne. Certaines Enseignes ne donnent pas droit au Cashback.",
            `**Disponibilité** : le Cashback apparaît « en attente » sur votre Compte, puis devient utilisable **${R.joursAttente} jours après l'envoi** de la dernière carte de la commande (pour une carte programmée, ${R.joursAttente} jours après la date d'envoi choisie).`,
            "**Validité** : chaque Cashback expire **12 mois** après avoir été crédité. Un email vous prévient 30 jours avant.",
            `**Utilisation** : sur une commande d'au moins **${R.commandeMinimum} €**, dans la limite de **${Math.round(R.plafondCommande * 100)} %** du montant de la commande.`,
            "Une commande payée, même en partie, avec du Cashback rapporte des Points mais **pas de nouveau Cashback**.",
            "Le Cashback n'est ni remboursable, ni échangeable contre de l'argent, ni transférable à un autre Compte.",
            "Il est annulé si la commande qui l'a généré est annulée ou remboursée.",
          ],
        },
      ],
    },
    {
      id: "codes",
      titre: "14. Codes partenaires",
      blocs: [
        "Des codes peuvent être diffusés par nos partenaires (créateurs de contenu notamment). Un code se saisit sur la page de paiement et nécessite d'être connecté à un Compte.",
        "Un code ne réduit pas le prix payé : il donne droit à du **Cashback**, crédité selon les règles de disponibilité et de validité de l'article 13. Ce Cashback **remplace** le Cashback lié à votre Palier pour cette commande (pas de cumul). La commande rapporte toujours des Points.",
        "Chaque code a ses propres conditions, indiquées lors de sa diffusion ou de sa saisie : période de validité, nombre d'utilisations, utilisation unique par client, Enseignes concernées. Un seul code par commande ; un code ne peut pas être combiné avec l'utilisation de votre Cashback.",
      ],
    },
    {
      id: "emails",
      titre: "15. Newsletter et rappels d'anniversaire",
      blocs: [
        "La newsletter (idées cadeaux, grandes occasions, offres) est envoyée uniquement aux personnes qui l'ont demandée. Chaque email contient un lien de désinscription.",
        `Si vous enregistrez la date d'anniversaire d'un bénéficiaire dans votre Compte, nous vous envoyons un rappel par email ${JOURS_AVANT_RAPPEL} jours avant. Il suffit de retirer la date pour ne plus recevoir ce rappel.`,
      ],
    },
    {
      id: "responsabilite",
      titre: "16. Responsabilité",
      blocs: [
        "Nous mettons tout en œuvre pour que le Site soit accessible et que les cartes soient envoyées dans les délais. Des interruptions peuvent toutefois survenir (maintenance, panne d'un prestataire, incident de messagerie).",
        "Notre responsabilité ne peut être engagée en cas de force majeure, de fait d'un tiers, ou de mauvaise utilisation du Site ou de la carte, notamment une erreur dans l'adresse email saisie ou la divulgation du code.",
        "Rien dans les CGV ne limite les droits que vous tenez de la loi en tant que consommateur.",
      ],
    },
    {
      id: "garanties",
      titre: "17. Garanties légales",
      blocs: [
        "Vous bénéficiez de la garantie légale de conformité applicable aux contenus numériques (articles L.224-25-12 et suivants du Code de la consommation) : une carte qui ne fonctionne pas comme annoncé est remplacée ou remboursée, comme prévu à l'article 9.",
      ],
    },
    {
      id: "propriete",
      titre: "18. Propriété intellectuelle",
      blocs: [
        "Le Site, son contenu et la marque Estalviar sont protégés. Les marques et logos des Enseignes appartiennent à leurs titulaires respectifs.",
      ],
    },
    {
      id: "donnees",
      titre: "19. Données personnelles",
      blocs: [
        "Les données collectées lors de vos commandes sont traitées conformément à notre [politique de confidentialité](/confidentialite). Si vous indiquez les coordonnées d'un Bénéficiaire, vous vous engagez à ce qu'il soit d'accord pour recevoir sa carte par email.",
      ],
    },
    {
      id: "service-client",
      titre: "20. Service client et réclamations",
      blocs: [
        "Pour toute question ou réclamation : [info@estalviar.com](mailto:info@estalviar.com), via la page [Contact](/contact), par téléphone au {{telephone}}, ou par courrier à {{adresse}}. Nous répondons dans les meilleurs délais, en général sous 48 heures ouvrées.",
      ],
    },
    {
      id: "mediation",
      titre: "21. Médiation",
      blocs: [
        "Si un litige n'a pas pu être résolu après une réclamation écrite auprès de notre service client, vous pouvez recourir **gratuitement** au médiateur de la consommation dont nous relevons (articles L.611-1 et suivants du Code de la consommation) :",
        { encadre: ["{{mediateurNom}}", "{{mediateurAdresse}}", "{{mediateurSite}}"] },
        "La saisine du médiateur doit intervenir dans un délai d'un an à compter de votre réclamation écrite.",
      ],
    },
    {
      id: "droit",
      titre: "22. Droit applicable et litiges",
      blocs: [
        "Les CGV sont soumises au droit français. À défaut d'accord amiable, le litige peut être porté devant la juridiction compétente, notamment celle de votre lieu de domicile.",
        "Nous pouvons modifier les CGV à tout moment. La version applicable à votre commande reste celle que vous avez acceptée lors de celle-ci.",
      ],
    },
    {
      id: "formulaire",
      titre: "23. Modèle de formulaire de rétractation",
      blocs: [
        "Le plus simple est d'utiliser notre [formulaire en ligne](/retractation). Vous pouvez aussi compléter et renvoyer ce modèle, uniquement si vous souhaitez vous rétracter :",
        {
          encadre: [
            "À l'attention de {{nom}} (Estalviar), {{adresse}}, [info@estalviar.com](mailto:info@estalviar.com) :",
            "Je vous notifie par la présente ma rétractation du contrat portant sur la vente de la carte cadeau ci-dessous :",
            "Commandée le : ………… — Enseigne et montant : …………",
            "Nom du consommateur : ………… — Adresse email utilisée pour la commande : …………",
            "Date : ………… — Signature (uniquement en cas de notification sur papier) : …………",
          ],
        },
      ],
    },
  ],
};

/* =====================================================================
   MENTIONS LÉGALES
   ===================================================================== */
export const mentions = {
  titre: "Mentions légales",
  miseAJour: MAJ,
  sections: [
    {
      id: "editeur",
      titre: "Éditeur du site",
      blocs: [
        "Le site estalviar.com est édité par {{nom}}, {{statut}}, exerçant sous le nom commercial Estalviar.",
        {
          liste: [
            "Adresse : {{adresse}}",
            "SIRET : {{siret}}",
            "Immatriculation : {{rcs}}",
            "{{tva}}",
            "Téléphone : {{telephone}}",
            "Email : [info@estalviar.com](mailto:info@estalviar.com)",
            "Directeur de la publication : {{directeurPublication}}",
          ],
        },
      ],
    },
    {
      id: "hebergement",
      titre: "Hébergement",
      blocs: [
        `Le site est hébergé par ${PRESTATAIRES.hebergeur}.`,
        "Les données des comptes et des commandes sont hébergées par Supabase, Inc. (www.supabase.com), sur des serveurs situés : {{regionDonnees}}.",
      ],
    },
    {
      id: "propriete",
      titre: "Propriété intellectuelle",
      blocs: [
        "Les textes, visuels, la charte graphique et la marque Estalviar sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite.",
        "Les marques, noms et logos des enseignes présentes sur le site appartiennent à leurs propriétaires respectifs. Ils sont utilisés pour désigner les cartes cadeaux proposées et n'impliquent aucun partenariat officiel, sauf mention contraire.",
      ],
    },
    {
      id: "liens",
      titre: "Liens",
      blocs: [
        "Le site peut contenir des liens vers d'autres sites (enseignes, réseaux sociaux). Estalviar n'est pas responsable de leur contenu.",
      ],
    },
    {
      id: "donnees",
      titre: "Données personnelles et cookies",
      blocs: [
        "Voir notre [politique de confidentialité](/confidentialite) et notre [politique de cookies](/cookies).",
      ],
    },
    {
      id: "contact",
      titre: "Contact",
      blocs: [
        "Pour toute question sur le site : [info@estalviar.com](mailto:info@estalviar.com) ou la page [Contact](/contact). Conditions de vente : voir les [CGV](/cgv).",
      ],
    },
  ],
};

/* =====================================================================
   POLITIQUE DE CONFIDENTIALITÉ
   ===================================================================== */
export const confidentialite = {
  titre: "Politique de confidentialité",
  miseAJour: MAJ,
  sommaireLabel: "Sommaire",
  intro: [
    "Cette politique explique quelles données nous collectons, pourquoi, combien de temps nous les gardons et comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.",
  ],
  sections: [
    {
      id: "responsable",
      titre: "1. Responsable du traitement",
      blocs: [
        "{{nom}}, {{statut}} (Estalviar), {{adresse}}. Contact pour toute question sur vos données : [info@estalviar.com](mailto:info@estalviar.com).",
      ],
    },
    {
      id: "donnees",
      titre: "2. Données collectées, finalités et bases légales",
      blocs: [
        {
          tableau: {
            entetes: ["Pourquoi", "Quelles données", "Base légale"],
            lignes: [
              ["Traiter et envoyer vos commandes, les renvoyer en cas de besoin", "Email de l'acheteur, prénom, email du bénéficiaire, message et personnalisation, montants, dates d'envoi, code des cartes (chiffré)", "Exécution du contrat"],
              ["Paiement et lutte contre la fraude", "Montant, identifiant de paiement (les données bancaires sont traitées par Stripe, jamais par nous), adresse IP", "Exécution du contrat, intérêt légitime (prévenir la fraude)"],
              ["Compte client", "Email, mot de passe (stocké chiffré), pseudo, prénom, nom, téléphone, date de naissance, genre, enseigne favorite et avatar si vous les renseignez", "Exécution du contrat"],
              ["Bénéficiaires et rappels d'anniversaire", "Nom, email et date d'anniversaire (jour et mois) des proches que vous enregistrez", "Exécution du contrat (service demandé)"],
              ["Programme de fidélité, cashback, codes partenaires", "Points, palier, mouvements de cashback, codes utilisés", "Exécution du contrat"],
              ["Cagnottes", "Email de l'organisateur et des participants, nom et message affichés, montants", "Exécution du contrat"],
              ["Newsletter", "Email, date d'inscription et de confirmation", "Consentement"],
              ["Demandes de devis, contact, rétractation", "Nom, entreprise, email, téléphone, contenu de la demande", "Mesures précontractuelles, obligation légale (rétractation)"],
              ["Sécurité du site", "Adresse IP et tentatives de connexion ou d'envoi de formulaires", "Intérêt légitime (protéger le site et les comptes)"],
              ["Comptabilité", "Commandes et paiements", "Obligation légale"],
            ],
          },
        },
        "Les champs obligatoires sont signalés dans les formulaires. Sans eux, nous ne pouvons pas traiter votre demande.",
      ],
    },
    {
      id: "tiers",
      titre: "3. Données de vos proches",
      blocs: [
        "Quand vous indiquez l'email d'un bénéficiaire ou enregistrez un proche dans votre compte, vous nous transmettez des données qui le concernent. Nous les utilisons seulement pour lui envoyer sa carte ou pour vous envoyer vos rappels, jamais pour de la prospection. Merci de vous assurer qu'il est d'accord.",
      ],
    },
    {
      id: "destinataires",
      titre: "4. Qui reçoit vos données ?",
      blocs: [
        "Vos données ne sont **jamais vendues ni louées**. Elles sont accessibles à Estalviar et à nos prestataires techniques, uniquement pour ce qui est nécessaire à leur mission :",
        {
          liste: [
            "**Supabase** : base de données et comptes clients ;",
            "**Netlify** : hébergement du site ;",
            "**Stripe** : paiement en ligne et prévention de la fraude ;",
            "**Resend** : envoi des emails (cartes, confirmations, newsletter) ;",
            "**Tillo** : fourniture des cartes cadeaux (seules les informations de commande nécessaires lui sont transmises).",
          ],
        },
        "Nous pouvons aussi communiquer des données aux autorités lorsque la loi l'exige.",
      ],
    },
    {
      id: "transferts",
      titre: "5. Transferts hors de l'Union européenne",
      blocs: [
        "Certains prestataires (notamment Netlify, Stripe et Resend) sont établis aux États-Unis ou y traitent des données. Ces transferts sont encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework) lorsque le prestataire y adhère, et/ou par les clauses contractuelles types de la Commission européenne.",
      ],
    },
    {
      id: "conservation",
      titre: "6. Combien de temps ?",
      blocs: [
        {
          tableau: {
            entetes: ["Données", "Durée"],
            lignes: [
              ["Compte client", "Jusqu'à sa suppression par vous. Un compte inactif depuis 3 ans peut être supprimé, après un email de prévenance."],
              ["Commandes, paiements, factures", "10 ans (obligation comptable), en archive"],
              ["Codes des cartes cadeaux", "Chiffrés, conservés avec la commande pour permettre leur renvoi"],
              ["Newsletter sans compte", "Jusqu'à votre désinscription, ou 3 ans sans interaction de votre part"],
              ["Demandes de contact et de devis", "3 ans après le dernier échange"],
              ["Demandes de rétractation", "5 ans (délai de prescription)"],
              ["Journaux de sécurité (tentatives de connexion)", "12 mois maximum"],
            ],
          },
        },
      ],
    },
    {
      id: "securite",
      titre: "7. Sécurité",
      blocs: [
        "Le site est accessible uniquement en HTTPS. Les codes des cartes cadeaux sont chiffrés dans notre base, l'accès aux données est limité par des règles strictes (chacun ne voit que ses propres données) et les mots de passe ne sont jamais stockés en clair.",
      ],
    },
    {
      id: "droits",
      titre: "8. Vos droits",
      blocs: [
        "Vous pouvez à tout moment demander l'**accès** à vos données, leur **rectification**, leur **effacement**, leur **portabilité**, la **limitation** du traitement, vous **opposer** à un traitement fondé sur l'intérêt légitime, **retirer votre consentement** (newsletter) et définir des directives sur le sort de vos données après votre décès.",
        "Écrivez-nous à [info@estalviar.com](mailto:info@estalviar.com) depuis l'adresse de votre compte. Nous répondons dans un délai d'un mois. Vous pouvez aussi modifier vos informations et supprimer votre compte directement depuis Mon compte.",
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL ([www.cnil.fr](https://www.cnil.fr)).",
      ],
    },
    {
      id: "prospection",
      titre: "9. Emails commerciaux",
      blocs: [
        "Nous ne vous envoyons la newsletter que si vous l'avez demandée (case dans votre compte ou formulaire de l'accueil, confirmé par email). Vous pouvez vous désinscrire à tout moment via le lien en bas de chaque email ou depuis votre compte. Les emails liés à vos commandes (confirmation, envoi de carte, cashback) ne sont pas de la prospection et vous sont toujours envoyés.",
      ],
    },
    {
      id: "mineurs",
      titre: "10. Mineurs",
      blocs: [
        "La création d'un compte est réservée aux personnes de 15 ans et plus. Les achats nécessitent d'être majeur ou autorisé par ses représentants légaux.",
      ],
    },
    {
      id: "cookies",
      titre: "11. Cookies",
      blocs: ["Voir notre [politique de cookies](/cookies)."],
    },
    {
      id: "modifications",
      titre: "12. Modifications",
      blocs: [
        "Cette politique peut évoluer, notamment si nous ajoutons un service. La date de mise à jour figure en haut de la page. En cas de changement important, nous vous en informons par email ou sur le site.",
      ],
    },
  ],
};

/* =====================================================================
   POLITIQUE DE COOKIES
   ===================================================================== */
export const cookies = {
  titre: "Politique de cookies",
  miseAJour: MAJ,
  intro: [
    "Un cookie (ou traceur) est un petit fichier enregistré par votre navigateur. Nous utilisons aussi le « stockage local » du navigateur, qui fonctionne de la même façon. Voici tout ce que le site dépose sur votre appareil.",
  ],
  sections: [
    {
      id: "liste",
      titre: "Ce que nous utilisons",
      blocs: [
        "**Uniquement des traceurs nécessaires au fonctionnement du site.** Ils sont exemptés de consentement : sans eux, le panier ou la connexion ne fonctionneraient pas.",
        {
          tableau: {
            entetes: ["Nom", "À quoi il sert", "Durée"],
            lignes: [
              ["estalviar-panier", "Garder le contenu de votre panier", "Jusqu'à la commande ou au vidage du panier"],
              ["estalviar-emails-beneficiaires", "Garder les emails saisis pendant le paiement", "Supprimé après la commande"],
              ["sb-…-auth-token", "Vous garder connecté à votre compte", "Jusqu'à la déconnexion"],
              ["NEXT_LOCALE", "Retenir la langue choisie", "1 an maximum"],
              ["estalviar-cookies-consentement", "Ne plus afficher le bandeau d'information sur les cookies", "Jusqu'à suppression par vous"],
            ],
          },
        },
        "Lors du paiement, vous êtes redirigé vers la page sécurisée de **Stripe**, qui dépose ses propres traceurs nécessaires à la sécurité du paiement et à la prévention de la fraude (voir la politique de Stripe).",
      ],
    },
    {
      id: "pas-de-pub",
      titre: "Pas de publicité ni de mesure d'audience",
      blocs: [
        "Nous n'utilisons **aucun cookie publicitaire, de réseau social ou de mesure d'audience**. Si nous en ajoutons un jour, ils ne seront déposés qu'après votre accord, via le bandeau cookies, et cette page sera mise à jour.",
      ],
    },
    {
      id: "gerer",
      titre: "Gérer les cookies",
      blocs: [
        "Vous pouvez supprimer les cookies et le stockage local depuis les réglages de votre navigateur. Le site fonctionnera alors partiellement (panier vidé, déconnexion).",
        "Une question ? [info@estalviar.com](mailto:info@estalviar.com)",
      ],
    },
  ],
};
