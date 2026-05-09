export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Service Worker registered: ', registration)
          
          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (installingWorker == null) {
              return
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('New content is available; please refresh.')
                } else {
                  console.log('Content is cached for offline use.')
                }
              }
            }
          }
        },
        (error) => {
          console.error('Error during service worker registration:', error)
        }
      )
    })
  }
}
