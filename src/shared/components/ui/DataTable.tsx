import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData> {
  data: TData[];
  columns: Array<{
    header: string;
    accessorKey?: keyof TData;
    cell?: (item: TData) => React.ReactNode;
  }>;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  className,
  emptyMessage = "No results found.",
}: DataTableProps<TData>) {
  return (
    <div className={cn("w-full overflow-auto rounded-md border border-border", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr className="border-b border-border transition-colors">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center align-middle text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="p-4 align-middle">
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? "")
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
