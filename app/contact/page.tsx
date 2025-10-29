"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>()

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    // Simulate form submission (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1500))

    console.log("Form data:", data)
    setSubmitSuccess(true)
    setIsSubmitting(false)
    reset()

    // Reset success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  return (
    <main className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-sm font-medium mb-6">
            <Mail className="h-4 w-4" />
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contactez-nous
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Une question ? Une suggestion ? N&apos;hésitez pas à nous contacter, nous vous répondrons dans les plus brefs délais.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Mail className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
                  <a
                    href="mailto:kapper.warecast@gmail.com"
                    className="text-zinc-400 hover:text-orange-500 transition-colors"
                  >
                    kapper.warecast@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Téléphone */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Phone className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Téléphone</h3>
                  <a
                    href="tel:0615777309"
                    className="text-zinc-400 hover:text-orange-500 transition-colors"
                  >
                    06 15 77 73 09
                  </a>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Adresse</h3>
                  <address className="text-zinc-400 not-italic">
                    WARECAST<br />
                    15 rue Claude Taffanel<br />
                    33800 BORDEAUX<br />
                    France
                  </address>
                </div>
              </div>
            </div>

            {/* Horaires */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Horaires de réponse</h3>
              <p className="text-zinc-400 text-sm">
                Nous répondons à vos messages du lundi au vendredi,
                de 9h à 18h.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Envoyez-nous un message
              </h2>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-500 text-sm">
                    ✓ Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-white mb-2">
                    Nom complet <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-orange-500"
                    {...register("name", { required: "Le nom est requis" })}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-white mb-2">
                    Email <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-orange-500"
                    {...register("email", {
                      required: "L'email est requis",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Adresse email invalide",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject" className="text-white mb-2">
                    Sujet <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="L'objet de votre message"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-orange-500"
                    {...register("subject", { required: "Le sujet est requis" })}
                  />
                  {errors.subject && (
                    <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-white mb-2">
                    Message <span className="text-orange-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Votre message..."
                    rows={6}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-orange-500 resize-none"
                    {...register("message", {
                      required: "Le message est requis",
                      minLength: {
                        value: 10,
                        message: "Le message doit contenir au moins 10 caractères",
                      },
                    })}
                  />
                  {errors.message && (
                    <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Envoyer le message
                    </>
                  )}
                </Button>

                <p className="text-zinc-500 text-sm text-center">
                  En envoyant ce formulaire, vous acceptez que vos données soient utilisées
                  pour répondre à votre demande. Consultez nos{' '}
                  <a href="/cgu-cgv" className="text-orange-500 hover:text-orange-400">
                    CGU
                  </a>{' '}
                  pour plus d&apos;informations.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Questions fréquentes
            </h2>
            <p className="text-zinc-400">
              Consultez d&apos;abord notre page{' '}
              <a href="/help" className="text-orange-500 hover:text-orange-400">
                Comment ça marche
              </a>{' '}
              pour trouver rapidement des réponses.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
