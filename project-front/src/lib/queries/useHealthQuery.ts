"use client";

import { apiGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type Health = {
  status: string;
  service: string;
};

export function useHealthQuery() {
  return useQuery<Health>({
    queryKey: ["health"],
    queryFn: () => apiGet<Health>("/health"),
    staleTime: 60 * 1000,
  });
}
