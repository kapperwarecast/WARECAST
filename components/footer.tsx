"use client"

import Link from "next/link"
import Image from "next/image"
import { ROUTES } from "@/constants/routes"

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <Link href={ROUTES.HOME} className="inline-block group">
              <Image
                src="/logo-warecast.png"
                alt="Warecast"
                width={225}
                height={60}
                className="h-10 w-auto transition-opacity group-hover:opacity-80"
              />
            </Link>
            <p className="mt-4 text-sm text-zinc-400">
              Plateforme de streaming collaboratif
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Navigation</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.HOME}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SEND_MOVIE}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Déposer un film
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.FORMULES}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Formules
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.HELP}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Comment ça marche
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Légal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.CGU_CGV}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  CGU / CGV
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.MENTIONS_LEGALES}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={ROUTES.CONTACT}
                  className="text-sm text-zinc-400 hover:text-orange-500 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-sm text-zinc-500 text-center">
            © {new Date().getFullYear()} Warecast. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
