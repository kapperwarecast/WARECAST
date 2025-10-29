export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Mentions Légales
          </h1>
          <p className="text-zinc-400 text-lg">
            Informations légales relatives au site Warecast
          </p>
        </div>

        {/* Content */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
          <div className="prose prose-invert prose-zinc max-w-none">
            {/* Éditeur du site */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Éditeur du site
              </h2>
              <div className="text-zinc-400 space-y-2">
                <p>
                  <strong className="text-white">Raison sociale :</strong> WARECAST
                </p>
                <p>
                  <strong className="text-white">Forme juridique :</strong> Société par actions simplifiée à associé unique
                </p>
                <p>
                  <strong className="text-white">Siège social :</strong> 15 rue Claude Taffanel, 33800 BORDEAUX
                </p>
                <p>
                  <strong className="text-white">SIRET :</strong> 897 738 019
                </p>
                <p>
                  <strong className="text-white">RCS :</strong> BORDEAUX 897 738 019
                </p>
                <p>
                  <strong className="text-white">Email :</strong>{' '}
                  <a href="mailto:kapper.warecast@gmail.com" className="text-orange-500 hover:text-orange-400">
                    kapper.warecast@gmail.com
                  </a>
                </p>
                <p>
                  <strong className="text-white">Téléphone :</strong> 06 66 53 27 05
                </p>
              </div>
            </section>

            {/* Directeur de la publication */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Directeur de la publication
              </h2>
              <div className="text-zinc-400">
                <p>
                  <strong className="text-white">Nom :</strong> Adrien Kapper
                </p>
              </div>
            </section>

            {/* Hébergement */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Hébergement
              </h2>
              <div className="text-zinc-400 space-y-4">
                <p className="text-sm">
                  Le site est hébergé par deux prestataires :
                </p>

                {/* Vercel */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <p className="text-white font-semibold mb-2">Hébergement web et application</p>
                  <p><strong className="text-white">Nom :</strong> Vercel Inc.</p>
                  <p><strong className="text-white">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                  <p><strong className="text-white">Site web :</strong>{' '}
                    <a href="https://vercel.com" className="text-orange-500 hover:text-orange-400" target="_blank" rel="noopener noreferrer">
                      vercel.com
                    </a>
                  </p>
                </div>

                {/* Supabase */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <p className="text-white font-semibold mb-2">Base de données et infrastructure backend</p>
                  <p><strong className="text-white">Nom :</strong> Supabase Inc.</p>
                  <p><strong className="text-white">Localisation :</strong> Serveurs hébergés en France (région EU)</p>
                  <p><strong className="text-white">Siège social :</strong> 970 Toa Payoh North, #07-04, Singapore 318992</p>
                  <p><strong className="text-white">Site web :</strong>{' '}
                    <a href="https://supabase.com" className="text-orange-500 hover:text-orange-400" target="_blank" rel="noopener noreferrer">
                      supabase.com
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Propriété intellectuelle
              </h2>
              <div className="text-zinc-400 space-y-3">
                <p>
                  L&apos;ensemble du contenu de ce site (structure, textes, logos, images, vidéos, etc.) est la propriété exclusive de WARECAST,
                  à l&apos;exception des marques, logos ou contenus appartenant à d&apos;autres sociétés partenaires ou auteurs.
                </p>
                <p>
                  Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments
                  est strictement interdite sans l&apos;accord exprès par écrit de WARECAST.
                </p>
                <p>
                  Cette représentation ou reproduction, par quelque procédé que ce soit, constitue une contrefaçon sanctionnée
                  par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cookies
              </h2>
              <div className="text-zinc-400 space-y-3">
                <p>
                  Le site utilise des cookies pour améliorer l&apos;expérience utilisateur et réaliser des statistiques de visite.
                </p>
                <p>
                  Vous pouvez gérer vos préférences de cookies à tout moment en modifiant les paramètres de votre navigateur.
                </p>
                <p>
                  Pour plus d&apos;informations, consultez nos{' '}
                  <a href="/cgu-cgv" className="text-orange-500 hover:text-orange-400">
                    Conditions Générales d&apos;Utilisation
                  </a>.
                </p>
              </div>
            </section>

            {/* Protection des données */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Protection des données personnelles
              </h2>
              <div className="text-zinc-400 space-y-3">
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés,
                  vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et d&apos;opposition aux données personnelles vous concernant.
                </p>
                <p>
                  Pour exercer ces droits, vous pouvez nous contacter :
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mt-2">
                  <p><strong className="text-white">Par email :</strong>{' '}
                    <a href="mailto:kapper.warecast@gmail.com" className="text-orange-500 hover:text-orange-400">
                      kapper.warecast@gmail.com
                    </a>
                  </p>
                  <p><strong className="text-white">Par courrier :</strong> WARECAST, 15 rue Claude Taffanel, 33800 BORDEAUX</p>
                </div>
                <p className="mt-4">
                  Pour plus d&apos;informations sur le traitement de vos données, consultez nos{' '}
                  <a href="/cgu-cgv" className="text-orange-500 hover:text-orange-400">
                    Conditions Générales d&apos;Utilisation
                  </a>.
                </p>
              </div>
            </section>

            {/* Limitation de responsabilité */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Limitation de responsabilité
              </h2>
              <div className="text-zinc-400 space-y-3">
                <p>
                  WARECAST ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l&apos;utilisateur,
                  lors de l&apos;accès au site, et résultant soit de l&apos;utilisation d&apos;un matériel ne répondant pas aux spécifications indiquées,
                  soit de l&apos;apparition d&apos;un bug ou d&apos;une incompatibilité.
                </p>
                <p>
                  WARECAST ne pourra également être tenue responsable des dommages indirects consécutifs à l&apos;utilisation du site.
                </p>
              </div>
            </section>

            {/* Droit applicable */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                Droit applicable et juridiction compétente
              </h2>
              <div className="text-zinc-400 space-y-3">
                <p>
                  Les présentes mentions légales sont régies par le droit français.
                </p>
                <p>
                  En cas de litige et à défaut d&apos;accord amiable, le litige sera porté devant les tribunaux français
                  conformément aux règles de compétence en vigueur.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Date de mise à jour */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </main>
  )
}
