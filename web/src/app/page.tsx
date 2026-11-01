"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Candidate = { id: string; label: string };

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCandidates([]);
    try {
      const res = await fetch("/api/address/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error("search failed");
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch (err: any) {
      setError(err.message ?? "search error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Auckland Property Check</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Understand a property before paying to investigate it. Demo data only.
      </p>
      <form onSubmit={search} className="mt-6 flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter an Auckland street address"
          className="flex-1 rounded border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || q.length < 2}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <ul className="mt-4 divide-y divide-neutral-200 rounded border border-neutral-200">
        {candidates.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => router.push(`/property/confirm?addressId=${c.id}`)}
              className="w-full px-3 py-3 text-left hover:bg-neutral-50"
            >
              {c.label}
            </button>
          </li>
        ))}
        {candidates.length === 0 && !loading && q.length > 0 && (
          <li className="px-3 py-3 text-sm text-neutral-500">
            No demo addresses match. Try &ldquo;Shanaway&rdquo; or &ldquo;Hobsonville&rdquo;.
          </li>
        )}
      </ul>
      <p className="mt-8 text-xs text-neutral-500">
        Demo fixtures only — not real assessments. Not a LIM.
      </p>
    </main>
  );
}
