import Link from "next/link"
import { ArrowRight, Upload, Copy, CreditCard, Users, Film, Server, HardDrive, Database, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
            Comment ça marche<span className="text-orange-500">?</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            La vidéothèque collaborative qui transforme vos films en streaming
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <Link href="/formules">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                Découvrir les formules
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-900">
                Voir le catalogue
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-zinc-700 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-zinc-700 rounded-full" />
          </div>
        </div>
      </section>

      {/* Section Déposer */}
      <section className="relative bg-zinc-950 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium">
                <Upload className="h-4 w-4" />
                Volontaire
              </div>

              <h2 className="text-5xl md:text-6xl font-bold text-white">
                Partagez vos films
              </h2>

              <p className="text-xl text-zinc-400 leading-relaxed">
                Enrichissez le catalogue en déposant vos Blu-ray et DVD.
                Warecast les numérise et les rend accessibles à toute la communauté.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Envoyez vos films</h3>
                    <p className="text-zinc-400">Blu-ray ou DVD en parfait état</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Numérisation</h3>
                    <p className="text-zinc-400">Délai variable selon le volume</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Disponible pour tous</h3>
                    <p className="text-zinc-400">Enrichissez le catalogue commun</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 mb-2">Adresse d&apos;envoi :</p>
                <p className="text-white font-mono">
                  WARECAST<br />
                  15 rue Claude Taffanel<br />
                  33800 BORDEAUX
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Propriété unique */}
      <section className="relative bg-black py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium">
              <Copy className="h-4 w-4" />
              Système équitable
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Propriété unique et échanges
            </h2>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Chaque film physique appartient à un seul utilisateur et peut être échangé librement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1 film = 1 propriétaire</h3>
              <p className="text-zinc-400">
                Chaque film physique déposé vous appartient. Vous en êtes le propriétaire unique, physique et numérique.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Copy className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Disponibilité réelle</h3>
              <p className="text-zinc-400">
                Un film devient indisponible uniquement si le propriétaire est en train de le regarder (session active de 48h)
              </p>
            </div>

            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Temps réel</h3>
              <p className="text-zinc-400">
                Dès qu&apos;une session se termine, le film redevient disponible pour échange instantanément
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Accéder à vos films */}
      <section className="relative bg-zinc-950 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Deux formules
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Accédez à vos films
            </h2>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Choisissez la formule qui vous convient
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* À la carte */}
            <div className="p-8 bg-gradient-to-b from-zinc-900 to-black border-2 border-zinc-800 rounded-3xl space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">À la carte</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">1,50€</span>
                  <span className="text-zinc-400">par échange</span>
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">1 film à la fois</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">48 heures par session</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Échanges illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Paiement par échange</span>
                </li>
              </ul>
            </div>

            {/* Abonnement */}
            <div className="relative p-8 bg-gradient-to-b from-orange-950 to-black border-2 border-orange-500 rounded-3xl space-y-6">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-full">
                  Populaire
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Abonnement</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">5€</span>
                  <span className="text-zinc-400">par mois</span>
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">1 film à la fois</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Échanges gratuits illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">48h par session</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Rotation automatique</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-zinc-500 mt-8">
            ⚠️ Tous les échanges nécessitent que le film soit disponible (propriétaire ne le regarde pas)
          </p>
        </div>
      </section>

      {/* Section Échanges */}
      <section className="relative bg-black py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium">
            <Users className="h-4 w-4" />
            Communauté
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white">
            Échanges automatiques et définitifs
          </h2>

          <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Pour regarder un film qui ne vous appartient pas, vous devez l&apos;échanger contre un de vos films.
            L&apos;échange est <strong className="text-white">instantané et définitif</strong> : vous devenez propriétaire du film échangé, et l&apos;autre utilisateur devient propriétaire du vôtre.
          </p>
        </div>
      </section>

      {/* Section Parrainage */}
      <section className="relative bg-zinc-950 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium">
              <Users className="h-4 w-4" />
              Parrainage communautaire
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Film de bienvenue
            </h2>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Chaque nouvel utilisateur reçoit automatiquement un film d&apos;un membre existant
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pour les nouveaux */}
            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl space-y-6">
              <h3 className="text-2xl font-bold text-white">Vous rejoignez Warecast</h3>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Recevez automatiquement un film lors de votre inscription</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Le film vous appartient définitivement</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Commencez immédiatement à échanger</span>
                </li>
              </ul>
            </div>

            {/* Pour les parrains */}
            <div className="p-8 bg-gradient-to-b from-orange-950 to-black border-2 border-orange-500 rounded-2xl space-y-6">
              <h3 className="text-2xl font-bold text-white">Vous parrainez</h3>

              <p className="text-zinc-300">
                Chaque fois qu&apos;un nouvel utilisateur s&apos;inscrit, un membre existant partage automatiquement un de ses films pour l&apos;accueillir.
              </p>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Système de badges</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-zinc-300"><strong className="text-orange-400">Bronze</strong> : 1 à 5 parrainages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-zinc-300"><strong className="text-zinc-400">Argent</strong> : 6 à 15 parrainages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-zinc-300"><strong className="text-yellow-400">Or</strong> : 16+ parrainages</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Pourquoi payer */}
      <section className="relative bg-black py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium">
              <Server className="h-4 w-4" />
              Transparence
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Pourquoi payer Warecast ?
            </h2>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Les films vous appartiennent. Vos paiements couvrent l&apos;infrastructure et les services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Numérisation */}
            <div className="p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Numérisation</h3>
              <p className="text-sm text-zinc-400">
                Conversion professionnelle de vos films physiques en format numérique haute qualité
              </p>
            </div>

            {/* Stockage physique */}
            <div className="p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <HardDrive className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stockage physique</h3>
              <p className="text-sm text-zinc-400">
                Conservation optimale de vos films dans des conditions contrôlées et sécurisées
              </p>
            </div>

            {/* Stockage numérique */}
            <div className="p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stockage numérique</h3>
              <p className="text-sm text-zinc-400">
                Hébergement sécurisé sur serveurs professionnels avec sauvegardes automatiques
              </p>
            </div>

            {/* Streaming */}
            <div className="p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Play className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Diffusion streaming</h3>
              <p className="text-sm text-zinc-400">
                Plateforme 24/7 avec reprise de lecture, disponibilité temps réel et bande passante
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <p className="text-center text-zinc-400">
              <span className="text-white font-semibold">Les frais de 1,50€ ou 5€/mois</span> couvrent ces infrastructures et services professionnels.
              <br />
              Warecast n&apos;est pas propriétaire des films, nous fournissons uniquement la plateforme technique.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative bg-gradient-to-b from-black to-zinc-950 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Prêt à commencer<span className="text-orange-500">?</span>
          </h2>

          <p className="text-xl text-zinc-400">
            Rejoignez la vidéothèque collaborative
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
                S&apos;inscrire gratuitement
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-900 w-full sm:w-auto">
                Parcourir le catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
