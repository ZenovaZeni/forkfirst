import type { TrendingCategoryId } from "./categories";

export type TrendingMergeItem = {
  full_name: string;
  stargazers_count: number;
};

export type CategorizedTrendingResult<T extends TrendingMergeItem> = {
  categoryId: TrendingCategoryId;
  items: T[];
};

export function topTrendingItems<T extends TrendingMergeItem>(items: T[], limit: number) {
  const deduped = new Map<string, T>();
  for (const item of items) {
    const existing = deduped.get(item.full_name);
    if (!existing || item.stargazers_count > existing.stargazers_count) {
      deduped.set(item.full_name, item);
    }
  }
  return Array.from(deduped.values())
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);
}

export function balancedTrendingItems<T extends TrendingMergeItem>(
  results: Array<CategorizedTrendingResult<T>>,
  categoryIds: TrendingCategoryId[],
  limit: number
) {
  const buckets = new Map<TrendingCategoryId, T[]>();
  const seen = new Set<string>();

  for (const categoryId of categoryIds) {
    const items = results
      .filter((result) => result.categoryId === categoryId)
      .flatMap((result) => result.items);
    buckets.set(categoryId, topTrendingItems(items, 4));
  }

  const merged: T[] = [];
  for (let index = 0; merged.length < limit; index += 1) {
    let addedThisRound = false;
    for (const categoryId of categoryIds) {
      const item = buckets.get(categoryId)?.[index];
      if (!item || seen.has(item.full_name)) continue;
      seen.add(item.full_name);
      merged.push(item);
      addedThisRound = true;
      if (merged.length >= limit) break;
    }
    if (!addedThisRound) break;
  }

  return merged;
}
