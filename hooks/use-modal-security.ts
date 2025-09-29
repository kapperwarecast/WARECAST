import { useEffect, useCallback } from 'react'

interface UseModalSecurityOptions {
  isOpen: boolean
  onClose: () => void
  modalSelector?: string
}

export function useModalSecurity({
  isOpen,
  onClose,
  modalSelector = '[data-payment-modal], [data-radix-dialog-content]'
}: UseModalSecurityOptions) {
  
  // Fonction pour désactiver complètement l'arrière-plan
  const disableBackground = useCallback(() => {
    if (!isOpen) return

    // Ajouter la classe au body
    document.body.classList.add('modal-open')
    
    // Désactiver tous les éléments interactifs
    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    
    interactiveElements.forEach(element => {
      const isInModal = element.closest(modalSelector)
      if (!isInModal) {
        element.setAttribute('data-disabled-by-modal', 'true')
        element.setAttribute('tabindex', '-1')
      }
    })

    // Empêcher le scroll
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    return scrollY
  }, [isOpen, modalSelector])

  // Fonction pour restaurer l'arrière-plan
  const enableBackground = useCallback(() => {
    // Retirer la classe du body
    document.body.classList.remove('modal-open')
    
    // Restaurer tous les éléments
    const disabledElements = document.querySelectorAll('[data-disabled-by-modal]')
    disabledElements.forEach(element => {
      element.removeAttribute('data-disabled-by-modal')
      element.removeAttribute('tabindex')
    })

    // Restaurer le scroll
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY.replace('-', '').replace('px', '')))
    }
  }, [])

  // Gestionnaire de fermeture sécurisé
  const secureClose = useCallback(() => {
    enableBackground()
    // Délai pour éviter la propagation d'événements
    setTimeout(() => {
      onClose()
    }, 10)
  }, [onClose, enableBackground])

  // Effet principal
  useEffect(() => {
    if (isOpen) {
      disableBackground()
    } else {
      enableBackground()
    }

    // Cleanup au démontage
    return () => {
      enableBackground()
    }
  }, [isOpen, disableBackground, enableBackground])

  // Gestionnaire global pour capturer les échappements
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        secureClose()
      }
    }

    const handleClick = (e: MouseEvent) => {
      // Si le clic n'est pas dans la modal, fermer
      const target = e.target as Element
      const isInModal = target.closest(modalSelector)
      
      if (!isInModal) {
        e.preventDefault()
        e.stopPropagation()
        secureClose()
      }
    }

    document.addEventListener('keydown', handleEscape, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('touchstart', handleClick, true)

    return () => {
      document.removeEventListener('keydown', handleEscape, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('touchstart', handleClick, true)
    }
  }, [isOpen, secureClose, modalSelector])

  return {
    secureClose,
    disableBackground,
    enableBackground
  }
}
