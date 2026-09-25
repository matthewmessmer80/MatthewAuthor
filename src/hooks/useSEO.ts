import { useEffect } from 'react';
import { seoService } from '../services/seoService';
import { SEOData } from '../types/seo';

export function useSEO(routeId: string, customData?: Partial<SEOData>, paramSlug?: string) {
  useEffect(() => {
    const applyCurrent = () => {
      const baseSEO = seoService.getRouteSEO(routeId, paramSlug);
      const finalSEO: SEOData = customData ? { ...baseSEO, ...customData } : baseSEO;
      seoService.applySEO(finalSEO);
    };

    applyCurrent();
    const unsubscribe = seoService.subscribe(applyCurrent);
    return () => {
      unsubscribe();
    };
  }, [routeId, paramSlug, JSON.stringify(customData)]);
}
