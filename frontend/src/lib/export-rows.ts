export interface ExportRowScope {
  includeFiltered: boolean;
  includeMarked: boolean;
}

export function resolveExportRows<T extends { id: number }>(
  allRows: T[],
  filteredRows: T[],
  markedIds: ReadonlySet<number>,
  scope: ExportRowScope,
): T[] {
  const result = new Map<number, T>();

  if (scope.includeFiltered) {
    for (const row of filteredRows) {
      result.set(row.id, row);
    }
  }

  if (scope.includeMarked) {
    for (const row of allRows) {
      if (markedIds.has(row.id)) {
        result.set(row.id, row);
      }
    }
  }

  return Array.from(result.values());
}

export const DEFAULT_EXPORT_ROW_SCOPE: ExportRowScope = {
  includeFiltered: true,
  includeMarked: true,
};
