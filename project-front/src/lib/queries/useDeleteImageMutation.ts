"use client";

import { deleteSavedImage } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SAVED_IMAGES_QUERY_KEY } from "./useSavedImagesQuery";

type DeleteImageParams = {
  id: string;
  token: string;
};

export function useDeleteImageMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteImageParams>({
    mutationFn: ({ id, token }) => deleteSavedImage(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_IMAGES_QUERY_KEY });
    },
  });
}
