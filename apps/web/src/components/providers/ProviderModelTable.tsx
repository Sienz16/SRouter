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
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Bot,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Play,
    Trash2,
} from "lucide-react";
import type { ModelObject } from "@srouter/types";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";

interface ProviderModelTableProps {
    models: ModelObject[];
    copied: string | null;
    onCopy: (modelId: string) => void;
    onDelete?: (modelId: string) => void;
}

export function ProviderModelTable({ models, copied, onCopy, onDelete }: ProviderModelTableProps) {
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
                            className="flex items-center gap-1.5 hover:text-[var(--ink)] transition-colors cursor-pointer"
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
                cell: ({ row }) => {
                    const model = row.original;
                    return (
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-[var(--field)] text-[var(--ink-2)]">
                                <Bot className="size-3.5" />
                            </div>
                            <span
                                className="font-bold text-[var(--ink)] truncate max-w-[220px] sm:max-w-md md:max-w-lg block text-xs"
                                title={model.id}
                            >
                                {model.id}
                            </span>
                            <button
                                type="button"
                                onClick={() => onCopy(model.id)}
                                className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1 rounded hover:bg-[var(--field)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                                title="Copy Model ID"
                            >
                                {copied === model.id ? (
                                    <Check className="size-3 text-emerald-500" />
                                ) : (
                                    <Copy className="size-3" />
                                )}
                            </button>
                        </div>
                    );
                },
            },
            {
                id: "status",
                header: "Status",
                cell: () => (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-semibold">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active</span>
                    </span>
                ),
            },
            {
                id: "actions",
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => {
                    const model = row.original;
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Link
                                to="/playground"
                                search={{ model: model.id }}
                                className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--field)] hover:bg-[var(--ink)] hover:text-[var(--canvas)] px-2 py-1 font-semibold text-[10.5px] text-[var(--ink)] transition-colors border border-[var(--line)] cursor-pointer"
                            >
                                <Play className="size-2.5" />
                                <span>Test</span>
                            </Link>

                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(model.id)}
                                    className="text-[var(--ink-3)] hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors cursor-pointer"
                                    title="Delete model from list"
                                >
                                    <Trash2 className="size-3" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ],
        [copied, onCopy, onDelete],
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
            {/* Table Container using @/components/ui/table & TanStack React Table */}
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] shadow-2xs overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="border-b border-[var(--line)] bg-[var(--field)]/50 hover:bg-[var(--field)]/50"
                            >
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className={`py-2.5 px-4 font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3)] ${
                                            header.id === "status"
                                                ? "hidden sm:table-cell"
                                                : header.id === "actions"
                                                  ? "text-right"
                                                  : ""
                                        }`}
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
                            <TableRow
                                key={row.id}
                                className="group hover:bg-[var(--hover)]/30 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className={`py-2.5 px-4 ${
                                            cell.column.id === "status"
                                                ? "hidden sm:table-cell"
                                                : cell.column.id === "actions"
                                                  ? "text-right"
                                                  : ""
                                        }`}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-[var(--ink-3)]">
                <div className="flex items-center gap-2 text-[11px]">
                    <span>Showing</span>
                    <span className="font-semibold text-[var(--ink)]">
                        {totalRows === 0 ? 0 : `${startRow}-${endRow}`}
                    </span>
                    <span>of</span>
                    <span className="font-semibold text-[var(--ink)]">{totalRows}</span>
                    <span>models</span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span>Rows:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                            className="rounded-[4px] border border-[var(--line)] bg-[var(--field)] px-2 py-0.5 text-[11px] text-[var(--ink)] focus:outline-none cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="flex size-6 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--field)] text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Previous page"
                        >
                            <ChevronLeft className="size-3.5" />
                        </button>
                        <span className="px-2 text-[11px] text-[var(--ink)]">
                            {pageCount === 0 ? 1 : currentPage + 1} / {Math.max(1, pageCount)}
                        </span>
                        <button
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="flex size-6 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--field)] text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
