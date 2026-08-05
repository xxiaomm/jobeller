"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { addFavorite, fetchFavoriteJobs, removeFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type FavoritesContextValue = {
  isLoading: boolean;
  isFavorited: (jobId: number) => boolean;
  toggle: (jobId: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavoriteIds(new Set());
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchFavoriteJobs(token)
      .then((jobs) => {
        if (!cancelled) setFavoriteIds(new Set(jobs.map((job) => job.id)));
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isFavorited = useCallback((jobId: number) => favoriteIds.has(jobId), [favoriteIds]);

  const toggle = useCallback(
    async (jobId: number) => {
      if (!token) return;
      const wasFavorited = favoriteIds.has(jobId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(jobId);
        else next.add(jobId);
        return next;
      });

      try {
        if (wasFavorited) await removeFavorite(jobId, token);
        else await addFavorite(jobId, token);
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
      }
    },
    [token, favoriteIds],
  );

  return (
    <FavoritesContext.Provider value={{ isLoading, isFavorited, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
}
