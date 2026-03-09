'use client';

import { useEffect, useState } from 'react';

interface ViewStatsProps {
  boatId: string;
  viewCount?: number;
}

interface ViewStatsData {
  totalViews: number;
  uniqueUserViews: number;
  dailyViews: Array<{
    date: string;
    views: number;
  }>;
}

export function ViewStats({ boatId, viewCount }: ViewStatsProps) {
  // Si on a le viewCount directement, l'utiliser
  if (viewCount !== undefined) {
    return (
      <div className="flex flex-col gap-2 text-darkgrey text-14">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-oceanblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <span>{viewCount} vue{viewCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  // Sinon, utiliser l'ancienne logique avec l'API (pour la compatibilité)
  const [stats, setStats] = useState<ViewStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/boat-views?boatId=${boatId}`);

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Failed to load view statistics');
        }
      } catch (err) {
        setError('Error loading view statistics');
        console.error('Error fetching view stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [boatId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-darkgrey text-14">
        <div className="w-4 h-4 border-2 border-oceanblue border-t-transparent rounded-full animate-spin"></div>
        Loading stats...
      </div>
    );
  }

  if (error || !stats) {
    return null; // Ne pas afficher d'erreur, simplement masquer les stats
  }

  return (
    <div className="flex flex-col gap-2 text-darkgrey text-14">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-oceanblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <span>{stats.totalViews} vues totales</span>
        </div>
        {stats.uniqueUserViews > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-oceanblue">👤</span>
            <span>{stats.uniqueUserViews} utilisateurs uniques</span>
          </div>
        )}
      </div>

      {/* Afficher les vues des 7 derniers jours si disponibles */}
      {stats.dailyViews && stats.dailyViews.length > 0 && (
        <div className="text-12 text-darkgrey/70">
          Derniers jours: {stats.dailyViews.slice(0, 7).map(day =>
            `${new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}: ${day.views}`
          ).join(' • ')}
        </div>
      )}
    </div>
  );
}
