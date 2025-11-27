"use client";

import { PlacedItemData, saveCanvasImage, SavedImage } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SAVED_IMAGES_QUERY_KEY } from "./useSavedImagesQuery";

type SaveImageParams = {
  name: string;
  imageData: string;
  token: string;
  placedItems?: PlacedItemData[];
};

export function useSaveImageMutation() {
  const queryClient = useQueryClient();

  return useMutation<SavedImage, Error, SaveImageParams>({
    mutationFn: ({ name, imageData, token, placedItems }) =>
      saveCanvasImage(name, imageData, token, placedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_IMAGES_QUERY_KEY });
    },
  });
}
