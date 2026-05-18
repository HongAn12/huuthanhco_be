import type { QueryResult } from "pg";

export type QueryExecutor = {
  query: (text: string, values?: unknown[]) => Promise<QueryResult>;
};
