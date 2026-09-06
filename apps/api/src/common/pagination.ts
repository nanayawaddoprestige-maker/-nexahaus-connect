import type { ListMeta } from "@nexahaus/types";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@nexahaus/types";

export interface PageArgs {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface Paginated<T> {
  __list: true;
  items: T[];
  meta: Omit<ListMeta, "requestId">;
}

export function pageParams(args: PageArgs): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, Math.trunc(args.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(args.pageSize ?? DEFAULT_PAGE_SIZE)),
  );
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

/**
 * Parse `?sort=field:asc,other:desc` into a Prisma orderBy array, restricted to
 * an allow-list of sortable fields for the resource.
 */
export function parseSort(
  sort: string | undefined,
  allowed: readonly string[],
  fallback: Record<string, "asc" | "desc">,
): Record<string, "asc" | "desc">[] {
  if (!sort) return [fallback];
  const parsed = sort
    .split(",")
    .map((part) => part.trim().split(":"))
    .filter(([field, dir]) => allowed.includes(field ?? "") && (dir === "asc" || dir === "desc"))
    .map(([field, dir]) => ({ [field as string]: dir as "asc" | "desc" }));
  return parsed.length > 0 ? parsed : [fallback];
}

export function paginate<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
  extra?: Partial<ListMeta>,
): Paginated<T> {
  return {
    __list: true,
    items,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      ...extra,
    },
  };
}
