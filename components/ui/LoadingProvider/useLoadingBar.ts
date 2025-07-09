'use client';

import { useLoading } from './LoadingProvider';

/**
 * Hook pour contrôler manuellement la barre de chargement
 * Utile pour les appels API ou des actions spécifiques
 */
export function useLoadingBar() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  /**
   * Exécute une fonction asynchrone avec la barre de chargement
   * @param asyncFn - Fonction asynchrone à exécuter
   * @returns Le résultat de la fonction
   */
  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      const result = await asyncFn();
      return result;
    } catch (error) {
      throw error;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  };
} 