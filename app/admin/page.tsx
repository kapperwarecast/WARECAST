"use client"

import Link from "next/link"
import { Download, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Administration
          </h1>
          <p className="text-zinc-400 text-lg">
            Gérez les imports et la configuration de votre application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* TMDB Movie Import */}
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors group">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                  <Download className="h-6 w-6 text-white" />
                </div>
                Import de films TMDB
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Importez automatiquement des films depuis The Movie Database en utilisant leurs IDs TMDB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-zinc-500">
                  <p>• Données complètes des films (titres, synopsis, casting...)</p>
                  <p>• Affiches officielles haute résolution</p>
                  <p>• Métadonnées enrichies automatiquement</p>
                </div>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/admin/import">
                    <Download className="h-4 w-4 mr-2" />
                    Importer des films
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Posters Import */}
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors group">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg group-hover:bg-purple-500 transition-colors">
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
                Affiches personnalisées
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Remplacez les affiches officielles par vos propres versions personnalisées et optimisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-zinc-500">
                  <p>• Affiches haute qualité et optimisées</p>
                  <p>• Remplacement automatique par TMDB ID</p>
                  <p>• Support des formats JPG, PNG, WebP</p>
                </div>
                <Button
                  asChild
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Link href="/admin/posters">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Importer des affiches
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-3">Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-zinc-300 font-medium mb-2">Import TMDB</h3>
              <p className="text-zinc-500">
                Utilisez les IDs TMDB (ex: 550 pour Fight Club) pour importer les données complètes des films. 
                Les affiches officielles seront téléchargées automatiquement.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-300 font-medium mb-2">Affiches personnalisées</h3>
              <p className="text-zinc-500">
                Nommez vos fichiers au format &quot;123 - Titre du film.jpg&quot; où 123 est l&apos;ID TMDB. 
                Les affiches remplaceront automatiquement celles des films correspondants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}