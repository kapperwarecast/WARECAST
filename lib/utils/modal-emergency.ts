// Fonction d'urgence pour restaurer toutes les interactions
// À utiliser si les éléments restent désactivés après fermeture de modal

export function emergencyRestoreInteractions() {
  console.log('🚨 RESTORATION D\'URGENCE - Restauration de toutes les interactions')
  
  // Restaurer tous les éléments désactivés par les modals
  const disabledElements = document.querySelectorAll('[data-disabled-by-modal]')
  console.log('Éléments à restaurer:', disabledElements.length)
  
  disabledElements.forEach(element => {
    element.removeAttribute('data-disabled-by-modal')
    ;(element as HTMLElement).style.pointerEvents = ''
    ;(element as HTMLElement).style.userSelect = ''
    ;(element as HTMLElement).style.opacity = ''
    ;(element as HTMLElement).style.filter = ''
  })
  
  // Restaurer le body
  document.body.style.pointerEvents = ''
  document.body.style.userSelect = ''
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  
  // Supprimer les classes problématiques
  document.body.classList.remove('modal-open')
  
  // Restaurer tous les éléments qui pourraient avoir des styles inline problématiques
  const allInteractiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select')
  allInteractiveElements.forEach(element => {
    const htmlElement = element as HTMLElement
    if (htmlElement.style.pointerEvents === 'none') {
      htmlElement.style.pointerEvents = ''
    }
    if (htmlElement.style.userSelect === 'none') {
      htmlElement.style.userSelect = ''
    }
    if (htmlElement.hasAttribute('tabindex') && htmlElement.getAttribute('tabindex') === '-1') {
      htmlElement.removeAttribute('tabindex')
    }
  })
  
  console.log('✅ Restauration d\'urgence terminée - Toutes les interactions devraient être restaurées')
}

// Pour utiliser dans la console du navigateur en cas d'urgence :
// window.emergencyRestoreInteractions = emergencyRestoreInteractions

// Fonction pour diagnostiquer l'état des interactions
export function diagnoseInteractions() {
  console.log('🔍 DIAGNOSTIC DES INTERACTIONS')
  
  const bodyPointerEvents = getComputedStyle(document.body).pointerEvents
  const bodyUserSelect = getComputedStyle(document.body).userSelect
  
  console.log('Body pointer-events:', bodyPointerEvents)
  console.log('Body user-select:', bodyUserSelect)
  console.log('Body classes:', document.body.className)
  
  const disabledElements = document.querySelectorAll('[data-disabled-by-modal]')
  console.log('Éléments avec data-disabled-by-modal:', disabledElements.length)
  
  const nonInteractiveElements = document.querySelectorAll('[style*="pointer-events: none"]')
  console.log('Éléments avec pointer-events: none:', nonInteractiveElements.length)
  
  // Vérifier quelques éléments clés
  const links = document.querySelectorAll('a')
  const buttons = document.querySelectorAll('button')
  
  console.log('Total liens:', links.length)
  console.log('Total boutons:', buttons.length)
  
  let blockedLinks = 0
  let blockedButtons = 0
  
  links.forEach(link => {
    const style = getComputedStyle(link)
    if (style.pointerEvents === 'none') blockedLinks++
  })
  
  buttons.forEach(button => {
    const style = getComputedStyle(button)
    if (style.pointerEvents === 'none') blockedButtons++
  })
  
  console.log('Liens bloqués:', blockedLinks)
  console.log('Boutons bloqués:', blockedButtons)
  
  if (blockedLinks > 0 || blockedButtons > 0 || bodyPointerEvents === 'none') {
    console.log('⚠️ PROBLÈME DÉTECTÉ - Des interactions sont bloquées')
    console.log('💡 Exécutez emergencyRestoreInteractions() pour corriger')
  } else {
    console.log('✅ Toutes les interactions semblent fonctionnelles')
  }
}

// Ajouter les fonctions au window pour accès global en cas d'urgence
if (typeof window !== 'undefined') {
  ;(window as any).emergencyRestoreInteractions = emergencyRestoreInteractions
  ;(window as any).diagnoseInteractions = diagnoseInteractions
}
