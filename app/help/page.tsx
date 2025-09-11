import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Navigation, Settings, User, Search, Info } from "lucide-react"

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Comment ça marche</h1>
          <p className="text-zinc-400 text-lg">
            Découvrez comment utiliser Warecast, votre plateforme de streaming vidéo personnelle
          </p>
        </div>

        {/* Grid de sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Vue d'ensemble */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Film className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Vue d'ensemble</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3">
              <p>
                Warecast est votre plateforme personnelle de streaming vidéo qui vous permet de :
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Parcourir votre catalogue de films</li>
                <li>Découvrir des informations détaillées sur chaque film</li>
                <li>Gérer votre collection vidéo</li>
                <li>Naviguer facilement dans votre médiathèque</li>
              </ul>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Navigation className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Navigation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3">
              <p>Utilisez la sidebar pour naviguer :</p>
              <ul className="space-y-2">
                <li><span className="text-orange-500">•</span> <strong>Catalogue :</strong> Page principale avec tous vos films</li>
                <li><span className="text-orange-500">•</span> <strong>Administration :</strong> Outils de gestion (si connecté)</li>
                <li><span className="text-orange-500">•</span> <strong>Info compte :</strong> Votre profil utilisateur</li>
              </ul>
              <p className="text-sm text-zinc-400">
                💡 Le bouton <span className="text-orange-500">X</span> orange vous ramène toujours au catalogue
              </p>
            </CardContent>
          </Card>

          {/* Catalogue des films */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Search className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Catalogue des films</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3">
              <p>Dans le catalogue, vous pouvez :</p>
              <ul className="space-y-2">
                <li><span className="text-orange-500">•</span> Parcourir tous vos films en grille</li>
                <li><span className="text-orange-500">•</span> Utiliser les filtres pour affiner votre recherche</li>
                <li><span className="text-orange-500">•</span> Cliquer sur un film pour voir ses détails</li>
                <li><span className="text-orange-500">•</span> Découvrir les acteurs et réalisateurs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Administration */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Settings className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Administration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3">
              <p>Si vous êtes connecté, accédez aux outils d&apos;administration :</p>
              <ul className="space-y-2">
                <li><span className="text-orange-500">•</span> <strong>Import :</strong> Ajoutez de nouveaux films à votre catalogue</li>
                <li><span className="text-orange-500">•</span> <strong>Affiches :</strong> Gérez les images de vos films</li>
                <li><span className="text-orange-500">•</span> <strong>Statistiques :</strong> Suivez l&apos;évolution de votre collection</li>
              </ul>
            </CardContent>
          </Card>

          {/* Compte utilisateur */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Compte utilisateur</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3">
              <p>Gérez votre compte utilisateur :</p>
              <ul className="space-y-2">
                <li><span className="text-orange-500">•</span> <strong>Connexion :</strong> Accédez à toutes les fonctionnalités</li>
                <li><span className="text-orange-500">•</span> <strong>Profil :</strong> Consultez vos informations personnelles</li>
                <li><span className="text-orange-500">•</span> <strong>Paramètres :</strong> Personnalisez votre expérience</li>
              </ul>
            </CardContent>
          </Card>

          {/* Raccourcis utiles */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Info className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Raccourcis utiles</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3">
              <p>Quelques astuces pour une navigation optimale :</p>
              <ul className="space-y-2">
                <li><span className="text-orange-500">•</span> Le bouton <span className="text-orange-500">+</span> ouvre le menu latéral</li>
                <li><span className="text-orange-500">•</span> Le bouton <span className="text-orange-500">X</span> ferme le menu et revient au catalogue</li>
                <li><span className="text-orange-500">•</span> Les éléments <span className="text-orange-500">orange</span> indiquent la page courante</li>
                <li><span className="text-orange-500">•</span> La sidebar reste ouverte pour naviguer entre les pages</li>
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-6">
              <p className="text-zinc-400">
                Vous avez maintenant toutes les clés pour profiter pleinement de Warecast,
                votre plateforme personnelle de streaming vidéo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}