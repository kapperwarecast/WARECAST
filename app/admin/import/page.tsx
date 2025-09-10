"use client"

import { useState } from "react"
import { ImportForm } from "@/components/admin/import-form"
import { ImportProgress } from "@/components/admin/import-progress"
import type { MovieImportResult } from "@/lib/tmdb/types"

export default function ImportPage() {
  const [results, setResults] = useState<MovieImportResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleImportStart = () => {
    setIsLoading(true)
    setResults([]) // Clear previous results
  }

  const handleImportComplete = (newResults: MovieImportResult[]) => {
    setResults(newResults)
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Administration - Import de films
          </h1>
          <p className="text-zinc-400">
            Importez automatiquement des films depuis The Movie Database (TMDB)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import form */}
          <div>
            <ImportForm 
              onImportStart={handleImportStart}
              onImportComplete={handleImportComplete}
            />
          </div>

          {/* Results */}
          <div>
            <ImportProgress 
              results={results}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </main>
  )
}