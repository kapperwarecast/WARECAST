"use client"

import { Package, CheckCircle2, Film, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function SendMoviePage() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 to-black" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium mb-6">
            <Package className="h-4 w-4" />
            Dépôt de films
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Déposez vos films
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 mb-8">
            Envoyez vos DVD/Blu-ray à Warecast pour une numérisation professionnelle
            et un accès en streaming depuis votre espace personnel.
          </p>

          {!user && (
            <div className="flex justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all"
              >
                Se connecter
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="relative bg-zinc-950 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Comment déposer vos films ?
            </h2>
            <p className="text-zinc-400 text-lg">
              Un processus simple en 3 étapes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-500 font-bold text-xl">
                  1
                </div>
                <Film className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Préparez vos films
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                Sélectionnez vos DVD ou Blu-ray en bon état. Assurez-vous que les disques ne sont pas rayés
                et que les boîtiers sont en bon état.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-500 font-bold text-xl">
                  2
                </div>
                <Package className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Emballez et envoyez
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                Emballez soigneusement vos films dans un colis sécurisé et envoyez-les à notre adresse.
                Les frais de port sont à votre charge.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-500 font-bold text-xl">
                  3
                </div>
                <CheckCircle2 className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Profitez du streaming
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                Une fois reçus, vos films sont numérisés et disponibles dans votre espace personnel
                en quelques jours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Address Section */}
      <section className="relative bg-black py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Adresse d&apos;envoi
              </h2>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-6 mb-6">
              <address className="not-italic text-lg text-white space-y-1">
                <p className="font-semibold">WARECAST</p>
                <p>15 rue Claude Taffanel</p>
                <p>33800 BORDEAUX</p>
                <p>France</p>
              </address>
            </div>

            <div className="space-y-4 text-zinc-400">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>Assurez-vous d&apos;inclure votre nom et adresse email dans le colis</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>Privilégiez un emballage sécurisé (carton rigide, papier bulle)</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>Conservez votre preuve d&apos;envoi en cas de litige</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>Nous vous recommandons un envoi en suivi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Criteria Section */}
      <section className="relative bg-zinc-950 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Critères de dépôt
            </h2>
            <p className="text-zinc-400 text-lg">
              Pour garantir une numérisation optimale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formats acceptés */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Formats acceptés
              </h3>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Blu-ray (prioritaire)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  DVD (si le film n&apos;existe pas en Blu-ray)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Disques en parfait état (sans rayures majeures)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Boîtiers et jaquettes en bon état
                </li>
              </ul>
            </div>

            {/* Ligne éditoriale */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Film className="h-6 w-6 text-orange-500" />
                Ligne éditoriale
              </h3>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Films de cinéma (fiction, documentaire)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Séries TV au format film
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Contenu acquis légalement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  Respect des droits d&apos;auteur
                </li>
              </ul>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-8 bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
            <p className="text-orange-500 text-sm">
              <strong>Important :</strong> Les films ne correspondant pas à notre ligne éditoriale ou en mauvais état
              ne seront pas numérisés et pourront ne pas être restitués. Warecast se réserve le droit de refuser
              certains contenus sans avoir à se justifier.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-black py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à déposer vos films ?
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            Vous avez des questions ?
          </p>
          <div className="flex justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all"
            >
              Nous contacter
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
