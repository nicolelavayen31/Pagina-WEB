export type PageRequest = { page: number; pageSize: number };

export type Page<T> = PageRequest & { items: T[]; total: number };
