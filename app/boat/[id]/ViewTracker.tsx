'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  boatId: string;
}

export function ViewTracker({ boatId }: ViewTrackerProps) {
  const hasRecordedView = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activityDetected = useRef(false);

  useEffect(() => {
    // Reset refs on component mount
    hasRecordedView.current = false;
    activityDetected.current = false;

    // Fonction pour enregistrer la vue
    const recordView = async () => {
      // Vérifier que la vue n'a pas déjà été enregistrée et qu'il y a eu de l'activité
      if (hasRecordedView.current || !activityDetected.current) {
        return;
      }

      // Vérifier que la page est visible (pas en arrière-plan)
      if (document.hidden) {
        return;
      }

      try {
        const response = await fetch('/api/boat-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ boatId }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('View recorded after 5 seconds:', data.viewId);
          hasRecordedView.current = true;
        } else {
          console.warn('Failed to record view:', response.status);
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    // Fonction pour détecter l'activité de l'utilisateur
    const handleUserActivity = () => {
      activityDetected.current = true;
    };

    // Fonction pour gérer la visibilité de la page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Si la page devient cachée, annuler le timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Si la page redevient visible et qu'aucune vue n'a été enregistrée, redémarrer le timer
        if (!hasRecordedView.current && !timerRef.current) {
          timerRef.current = setTimeout(recordView, 5000);
        }
      }
    };

    // Ajouter les event listeners pour détecter l'activité
    const events = ['scroll', 'mousemove', 'click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Ajouter le listener pour la visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Démarrer le timer de 5 secondes
    timerRef.current = setTimeout(recordView, 5000);

    // Cleanup function
    return () => {
      // Nettoyer le timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Nettoyer les event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [boatId]);

  // Ce composant ne rend rien visuellement
  return null;
}
