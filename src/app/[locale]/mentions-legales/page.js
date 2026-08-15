export default function MentionsLegales() {
  return (
    <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory/80 leading-relaxed">
      <h1 className="text-3xl font-semibold text-ivory mb-8">Mentions légales</h1>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">Éditeur du site</h2>
      <p>
        Le site Estalviar (estalviar.com) est édité par [NOM DE L'ENTREPRISE], [forme juridique — ex : SASU, EURL],
        au capital de [MONTANT] €, immatriculée au Registre du Commerce et des Sociétés de [VILLE] sous le numéro
        SIRET [NUMÉRO SIRET], dont le siège social est situé au [ADRESSE COMPLÈTE].
      </p>
      <p className="mt-2">
        Numéro de TVA intracommunautaire : [NUMÉRO TVA]<br />
        Directeur de la publication : [NOM DU RESPONSABLE]<br />
        Email : info@estalviar.com
      </p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">Hébergement</h2>
      <p>
        Le site est hébergé par Netlify, Inc., 44 Montgomery Street, Suite 300, San Francisco, California 94104, USA.
      </p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments du site Estalviar (textes, images, logos, charte graphique) est protégé par le droit
        de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.
        Les marques et logos des enseignes partenaires (Amazon, Fnac, Steam, etc.) appartiennent à leurs propriétaires
        respectifs et sont utilisés à titre d'information uniquement.
      </p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">Médiation de la consommation</h2>
      <p>
        Conformément à l'article L.616-1 du Code de la consommation, le client dispose du droit de recourir
        gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige.
        Le médiateur pourra être contacté à l'adresse suivante : [COORDONNÉES DU MÉDIATEUR].
      </p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">Contact</h2>
      <p>
        Pour toute question relative au site ou à son utilisation : info@estalviar.com
      </p>
    </div>
  );
}