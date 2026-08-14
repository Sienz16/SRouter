import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
    type ColumnDef,
    type SortingState,
    type PaginationState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { ModelObject } from "@srouter/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { getProviderBadgeColor, providerFor } from "@/utils/model.utils";

export function ModelTable({ models }: { models: ModelObject[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    });

    const columns = useMemo<ColumnDef<ModelObject>[]>(
        () => [
            {
                accessorKey: "id",
                header: ({ column }) => {
                    const isSorted = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                        >
                            <span>Model ID</span>
                            {isSorted === "asc" ? (
                                <ArrowUp className="size-3 text-amber-500" />
                            ) : isSorted === "desc" ? (
                                <ArrowDown className="size-3 text-amber-500" />
                            ) : (
                                <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                            )}
                        </button>
                    );
                },
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-semibold text-foreground">
                        {row.original.id}
                    </span>
                ),
            },
            {
                id: "provider",
                accessorFn: (row) => providerFor(row),
                header: ({ column }) => {
                    const isSorted = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                        >
                            <span>Provider</span>
                            {isSorted === "asc" ? (
                                <ArrowUp className="size-3 text-amber-500" />
                            ) : isSorted === "desc" ? (
                                <ArrowDown className="size-3 text-amber-500" />
                            ) : (
                                <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                            )}
                        </button>
                    );
                },
                cell: ({ row }) => {
                    const provider = providerFor(row.original);
                    const badgeColorClass = getProviderBadgeColor(provider);
                    return (
                        <Badge
                            variant="outline"
                            className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border ${badgeColorClass}`}
                        >
                            {provider}
                        </Badge>
                    );
                },
            },
            {
                id: "capabilities",
                header: "Capabilities",
                cell: () => (
                    <span className="text-muted-foreground text-xs font-mono">
                        Chat, Streaming, Tools
                    </span>
                ),
            },
            {
                id: "status",
                header: "Status",
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 font-mono text-xs">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                    </span>
                ),
            },
            {
                id: "action",
                header: () => <div className="text-right">Action</div>,
                cell: ({ row }) => (
                    <div className="text-right">
                        <Link
                            to="/playground"
                            search={{ model: row.original.id }}
                            className="inline-flex items-center gap-1 rounded bg-secondary text-foreground hover:bg-foreground hover:text-background px-2.5 py-1 text-xs font-semibold transition-all border border-border/60"
                        >
                            <Play className="size-3" />
                            Playground
                        </Link>
                    </div>
                ),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: models,
        columns,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const pageCount = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const totalRows = models.length;
    const startRow = totalRows === 0 ? 0 : currentPage * pageSize + 1;
    const endRow = Math.min((currentPage + 1) * pageSize, totalRows);

    return (
        <div className="space-y-3 font-mono">
            <Card className="p-0 overflow-hidden border border-border/70">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className={header.id === "action" ? "text-right" : ""}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className={cell.column.id === "action" ? "text-right" : ""}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-[11px]">
                    <span>Showing</span>
                    <span className="font-semibold text-foreground">
                        {totalRows === 0 ? 0 : `${startRow}-${endRow}`}
                    </span>
                    <span>of</span>
                    <span className="font-semibold text-foreground">{totalRows}</span>
                    <span>models</span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span>Rows:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                            className="rounded-[4px] border border-border bg-secondary/30 px-2 py-0.5 text-[11px] text-foreground focus:outline-none cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="flex size-6 items-center justify-center rounded-[4px] border border-border bg-secondary/30 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Previous page"
                        >
                            <ChevronLeft className="size-3.5" />
                        </button>
                        <span className="px-2 text-[11px] text-foreground">
                            {pageCount === 0 ? 1 : currentPage + 1} / {Math.max(1, pageCount)}
                        </span>
                        <button
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="flex size-6 items-center justify-center rounded-[4px] border border-border bg-secondary/30 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Next page"
                        >
                            <ChevronRight className="size-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
