"use client";

import { useHealthQuery } from "@/lib/queries/useHealthQuery";

export default function TestApiPage() {
  const { data, isLoading, isError, error } = useHealthQuery();

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Test API</h1>

      {isLoading && <p className="mt-4 text-black/70">Loading...</p>}
      {isError && (
        <p className="mt-4 text-red-600">
          Error: {(error as Error).message}
        </p>
      )}

      {data && (
        <pre className="mt-4 rounded-xl bg-black/5 p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
