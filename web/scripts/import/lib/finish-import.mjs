// Shared end-of-import checks.
// A download stays draft until this says the page count matches the source
// and promote_dataset_version has validated every shape and swapped the
// live version in one database transaction.

export function pageContinues(data, featureCount, pageSize) {
  return data?.exceededTransferLimit === true || featureCount === pageSize;
}

/** An empty page after a full page is a broken download, not the end of the feed. */
export function assertNotShortPage(features, expectingMore, offset) {
  if (features.length === 0 && expectingMore) {
    throw new Error(`empty page at offset ${offset} while the source still had rows`);
  }
}

export function assertCount(total, expected, label = "import") {
  if (expected == null) return;
  if (total !== expected) {
    throw new Error(`${label}: stored ${total} rows but the source count is ${expected}`);
  }
}

export async function sourceCount(queryUrl) {
  const res = await fetch(queryUrl);
  if (!res.ok) throw new Error(`count request ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "count request failed");
  if (typeof data.count !== "number") throw new Error("count request returned no count");
  return data.count;
}

export async function promoteVersion(sb, { versionId, total, expected, label }) {
  assertCount(total, expected, label);
  if (total === 0) throw new Error(`${label ?? "import"} returned no features`);
  const { error } = await sb.rpc("promote_dataset_version", {
    p_version_id: versionId,
    p_row_count: total,
  });
  if (error) throw new Error(error.message);
}
