"use client";

import { getSavedImages, SavedImage } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const SAVED_IMAGES_QUERY_KEY = ["savedImages"] as const;

export function useSavedImagesQuery(token: string | undefined, limit?: number) {
  return useQuery<SavedImage[]>({
    queryKey: [...SAVED_IMAGES_QUERY_KEY, token, limit],
    queryFn: async () => {
      if (!token) throw new Error("No access token");
      const images = await getSavedImages(token);
      return limit ? images.slice(0, limit) : images;
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });
}
