export default function CguCgvPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Conditions Générales
          </h1>
          <p className="text-zinc-400 text-lg">
            Conditions Générales d&apos;Utilisation et de Vente
          </p>
        </div>

        {/* CGU Section */}
        <section className="mb-16">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium mb-6">
              CGU
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Conditions Générales d&apos;Utilisation
            </h2>

            <div className="prose prose-invert prose-zinc max-w-none">
              <div className="text-zinc-400 text-sm mb-8 leading-relaxed">
                <p>
                  Le site internet <a href="https://www.warecast.fr" className="text-orange-500 hover:text-orange-400">www.warecast.fr</a> est édité et géré par la société <strong>WARECAST</strong>,
                  société par actions simplifiée à associé unique immatriculée au Registre du commerce et des sociétés de
                  BORDEAUX sous le numéro 897 738 019, ayant son siège social 15 rue Claude Taffanel, 33800 BORDEAUX.
                </p>
              </div>

              {/* Article 1 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 1 : Objet</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Les présentes conditions générales d&apos;utilisation ont pour objet de définir les conditions d&apos;utilisation du Site.
                  La navigation sur le Site vaut acceptation pleine et entière par l&apos;Utilisateur des présentes CGU, sans restriction ni réserve.
                </p>
              </article>

              {/* Article 2 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 2 : Accessibilité du Site</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Le Site est accessible 7j/7, 24h/24, sauf cas de force majeure ou fait d&apos;un tiers.
                  Le Site pourra être suspendu provisoirement pour des opérations de maintenance ou des raisons d&apos;interruption de service non-imputables à WARECAST.
                </p>
              </article>

              {/* Article 3 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 3 : Achat d&apos;un DVD/Blu-ray</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Lorsque l&apos;Utilisateur est abonné au service, il aura la possibilité d&apos;acquérir un DVD/Blu-ray auprès d&apos;un autre utilisateur.
                </p>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Ces ventes sont conclues entre deux Utilisateurs et sont régies par le droit applicable aux ventes conclues entre consommateurs,
                  excluant tout droit de rétractation ou application de la garantie légale de conformité.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  WARECAST n&apos;a pas la qualité de vendeur mais seulement d&apos;intermédiaire et n&apos;est en conséquence pas partie au contrat de vente.
                </p>
              </article>

              {/* Article 4 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 4 : Obligations et responsabilité de l&apos;Utilisateur</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">L&apos;Utilisateur s&apos;engage à respecter les présentes CGU et notamment à :</p>
                <ul className="list-disc list-inside text-zinc-400 space-y-2">
                  <li>Respecter les droits de propriété intellectuelle attachés aux films présentés sur le Site</li>
                  <li>Faire preuve de courtoisie à l&apos;égard des autres Utilisateurs</li>
                  <li>Respecter le processus de vente des DVD/Blu-ray</li>
                </ul>
              </article>

              {/* Article 5 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 5 : Obligations et responsabilité de WARECAST</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  WARECAST assure ses meilleurs efforts afin que les informations contenues sur le Site soient aussi précises que possible.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  WARECAST décline toute responsabilité concernant : le fonctionnement défectueux de l&apos;infrastructure de l&apos;Utilisateur,
                  les dysfonctionnements du réseau, les interruptions pour maintenance, la sécurité des systèmes, ou l&apos;usurpation d&apos;identité.
                </p>
              </article>

              {/* Article 6 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 6 : Liens hypertextes</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Le Site est susceptible de contenir des liens hypertextes. WARECAST ne pourra être tenue pour responsable
                  de la disponibilité de ces sites ou des contenus disponibles sur ces sites.
                </p>
              </article>

              {/* Article 7 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 7 : Cookies</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">Le Site contient différents types de cookies :</p>
                <ul className="list-disc list-inside text-zinc-400 space-y-2">
                  <li>Cookies techniques : indispensables pour la navigation</li>
                  <li>Cookies de mesure d&apos;audience et de statistiques</li>
                  <li>Cookies de partage</li>
                  <li>Cookies de sécurisation des paiements</li>
                  <li>Cookies publicitaires</li>
                </ul>
              </article>

              {/* Article 8 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 8 : Données personnelles</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Les données personnelles collectées via le Site sont : adresse email, nom et prénom, coordonnées bancaires, date de naissance.
                </p>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  WARECAST conserve les données personnelles le temps strictement nécessaire à la réalisation des objectifs pour lesquels elles sont collectées.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mt-4">
                  <p className="text-sm font-semibold text-white mb-2">Droits de l&apos;Utilisateur (RGPD) :</p>
                  <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                    <li>Droit à l&apos;information</li>
                    <li>Droit d&apos;accès</li>
                    <li>Droit de rectification</li>
                    <li>Droit à l&apos;effacement / droit à l&apos;oubli</li>
                    <li>Droit d&apos;opposition</li>
                    <li>Droit de retrait du consentement</li>
                    <li>Droit à la portabilité des données</li>
                  </ul>
                  <p className="text-zinc-400 text-sm mt-3">
                    Contact : <span className="text-orange-500">kapper.warecast@gmail.com</span> | Tél : 06 15 77 73 09
                  </p>
                </div>
              </article>

              {/* Article 9 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 9 : Propriété intellectuelle</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Toute reproduction/modification/transmission/exploitation de tout ou partie du Site ou de son contenu est strictement interdite.
                  Les films présentés sur le Site sont protégés par le droit d&apos;auteur.
                </p>
              </article>

              {/* Article 10 */}
              <article>
                <h3 className="text-xl font-semibold text-white mb-3">Article 10 : Litiges</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Tout litige relatif à l&apos;application et/ou l&apos;interprétation des CGU sera soumis au droit français
                  et devra faire l&apos;objet d&apos;une tentative de règlement amiable par priorité.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CGV Section */}
        <section>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium mb-6">
              CGV
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Conditions Générales de Vente
            </h2>

            <div className="prose prose-invert prose-zinc max-w-none">
              {/* Article 1 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 1 : Objet</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Les présentes conditions générales de vente ont pour objet de définir les conditions de souscription aux services proposés par WARECAST.
                  La souscription d&apos;un abonnement vaut acceptation pleine et entière des présentes CGV et CGU.
                </p>
              </article>

              {/* Article 2 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 2 : Description des services proposés</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  WARECAST propose un service de dépôt, de conservation et de numérisation de films au format Blu-ray (ou DVD si le film n&apos;existe pas au format Blu-ray).
                </p>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  WARECAST réceptionnera les films et s&apos;assurera qu&apos;ils sont :
                </p>
                <ul className="list-disc list-inside text-zinc-400 space-y-1 mb-3">
                  <li>En parfait état</li>
                  <li>Au format Blu-ray (ou DVD si nécessaire)</li>
                  <li>Conformes à la ligne éditoriale du site</li>
                </ul>
                <p className="text-zinc-400 leading-relaxed">
                  WARECAST effectuera le dépôt des films et réalisera une copie numérique qui sera mise à disposition sur l&apos;espace Abonné du Souscripteur.
                </p>
              </article>

              {/* Article 3 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 3 : Abonnement</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Les services sont accessibles via un système d&apos;abonnement mensuel libellé en euros toutes taxes comprises.
                </p>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Le maintien en place de l&apos;abonnement est subordonné à :
                </p>
                <ul className="list-disc list-inside text-zinc-400 space-y-2">
                  <li>Envoi de trois films dans le délai d&apos;un mois suivant la souscription</li>
                  <li>Paiement de l&apos;abonnement chaque mois à date anniversaire</li>
                  <li>Respect des CGV et CGU</li>
                </ul>
              </article>

              {/* Article 4 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 4 : Déclarations et garanties du Souscripteur</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Le Souscripteur déclare être propriétaire des films adressés en dépôt et les avoir acquis de source licite.
                  Il garantit que le contenu ne porte pas atteinte aux droits des mineurs, au droit à l&apos;image, ou à la dignité humaine.
                </p>
              </article>

              {/* Article 5 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 5 : Obligations du Souscripteur</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">Le Souscripteur s&apos;engage à :</p>
                <ul className="list-disc list-inside text-zinc-400 space-y-2">
                  <li>Envoyer trois films en parfait état dans le délai d&apos;un mois</li>
                  <li>Visionner la copie numérique uniquement dans un cadre familial</li>
                  <li>Ne pas faire un usage commercial de la copie numérique</li>
                  <li>Ne pas céder la copie numérique sans céder la propriété du film physique</li>
                  <li>Payer les échéances de son abonnement</li>
                  <li>Respecter les CGV et CGU</li>
                </ul>
              </article>

              {/* Article 6 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 6 : Obligations de WARECAST</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">WARECAST s&apos;engage à :</p>
                <ul className="list-disc list-inside text-zinc-400 space-y-2">
                  <li>Conserver les films dans un local adapté</li>
                  <li>Réaliser une copie numérique dans une qualité optimale</li>
                  <li>Rattacher la copie numérique à l&apos;espace Abonné</li>
                  <li>Créditer l&apos;espace Abonné d&apos;un crédit par film</li>
                  <li>Actualiser les crédits en fonction des échanges</li>
                  <li>Veiller à la protection des données personnelles</li>
                </ul>
              </article>

              {/* Article 7 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 7 : Prise d&apos;effet / Durée / Résiliation</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  L&apos;abonnement prend effet au jour de sa souscription pour une durée indéterminée.
                  Le Souscripteur pourra bénéficier des services sans délai, excluant tout droit de rétractation.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  L&apos;abonnement pourra être résilié à tout instant. La résiliation entraînera la perte des crédits,
                  la conservation par WARECAST du montant de l&apos;abonnement en cours et le transfert de propriété des films mis en dépôt.
                </p>
              </article>

              {/* Article 8 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 8 : Responsabilité</h3>
                <p className="text-zinc-400 leading-relaxed">
                  WARECAST décline toute responsabilité concernant le fonctionnement défectueux de l&apos;infrastructure du Souscripteur,
                  les dysfonctionnements réseau, les interruptions pour maintenance, ou l&apos;usurpation d&apos;identité.
                </p>
              </article>

              {/* Article 9 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 9 : Données personnelles</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Le Souscripteur devra créer un espace personnel avec des données de connexion personnelles et confidentielles.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  Les données personnelles seront stockées sur des serveurs situés en France.
                  Le Souscripteur bénéficie d&apos;un droit d&apos;accès et de rectification.
                </p>
              </article>

              {/* Article 10 */}
              <article className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Article 10 : Propriété intellectuelle</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Toute reproduction/modification/transmission/exploitation de tout ou partie du site ou de son contenu est strictement interdite.
                </p>
              </article>

              {/* Article 11 */}
              <article>
                <h3 className="text-xl font-semibold text-white mb-3">Article 11 : Litiges</h3>
                <p className="text-zinc-400 leading-relaxed mb-3">
                  Tout litige sera soumis au droit français et devra faire l&apos;objet d&apos;une tentative de règlement amiable.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mt-4">
                  <p className="text-sm font-semibold text-white mb-2">Médiateur de la consommation :</p>
                  <p className="text-zinc-400 text-sm">
                    Centre de la Médiation de la Consommation de Conciliateurs de Justice (CM2C)<br />
                    14 rue Saint Jean 75017 PARIS<br />
                    Téléphone : 01 89 47 00 14<br />
                    <a href="http://www.cm2c.net" className="text-orange-500 hover:text-orange-400">www.cm2c.net</a>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm text-center">
            Pour toute question concernant ces conditions, contactez-nous à{' '}
            <a href="mailto:kapper.warecast@gmail.com" className="text-orange-500 hover:text-orange-400">
              kapper.warecast@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
