import Link from "next/link"
import { ArrowRight, Upload, Copy, CreditCard, Users, Film } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
            Comment ça marche<span className="text-red-600">?</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            La vidéothèque collaborative qui transforme vos films en streaming
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <Link href="/formules">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-sm font-medium">
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
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Envoyez vos films</h3>
                    <p className="text-zinc-400">Blu-ray ou DVD en parfait état</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Numérisation</h3>
                    <p className="text-zinc-400">Délai variable selon le volume</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
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

      {/* Section Copies limitées */}
      <section className="relative bg-black py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-sm font-medium">
              <Copy className="h-4 w-4" />
              Système équitable
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Un système de copies limitées
            </h2>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Comme une vidéothèque physique, chaque film a un nombre de copies limité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1 film = 1 copie</h3>
              <p className="text-zinc-400">
                Chaque film physique déposé génère une copie numérique disponible
              </p>
            </div>

            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-4">
                <Copy className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Disponibilité réelle</h3>
              <p className="text-zinc-400">
                Si toutes les copies sont empruntées, le film devient indisponible pour tous
              </p>
            </div>

            <div className="p-8 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Temps réel</h3>
              <p className="text-zinc-400">
                Dès qu&apos;un utilisateur rend un film, il redevient disponible instantanément
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Emprunter */}
      <section className="relative bg-zinc-950 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Deux formules
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Empruntez vos films
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
                  <span className="text-zinc-400">par film</span>
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Plusieurs films simultanés</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">48 heures par film</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Paiement unique</span>
                </li>
              </ul>
            </div>

            {/* Abonnement */}
            <div className="relative p-8 bg-gradient-to-b from-red-950 to-black border-2 border-red-600 rounded-3xl space-y-6">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full">
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
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">1 film à la fois</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Emprunts illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">48h par film</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300">Rotation libre</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-zinc-500 mt-8">
            ⚠️ Toutes les formules sont soumises à la disponibilité des copies
          </p>
        </div>
      </section>

      {/* Section Échanges */}
      <section className="relative bg-black py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-sm font-medium">
            <Users className="h-4 w-4" />
            Communauté
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white">
            Échangez entre vous
          </h2>

          <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Notre plateforme d&apos;échanges permet aux utilisateurs de transférer leurs films.
            Chaque échange transfère à la fois la copie numérique et le film physique.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative bg-gradient-to-b from-zinc-950 to-black py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Prêt à commencer<span className="text-red-600">?</span>
          </h2>

          <p className="text-xl text-zinc-400">
            Rejoignez la vidéothèque collaborative
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
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
