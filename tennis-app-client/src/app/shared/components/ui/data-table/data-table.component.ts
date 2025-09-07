import { Component, Input, Output, EventEmitter, OnInit, OnChanges, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'badge' | 'custom';
  format?: (value: unknown) => string;
  badgeVariant?: (value: unknown) => 'default' | 'success' | 'warning' | 'error' | 'info';
  customTemplate?: TemplateRef<unknown>;
}

export interface TableConfig {
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  responsive?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  pageSizes?: number[];
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

export interface FilterEvent {
  column: string;
  value: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    BadgeComponent
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() data: unknown[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() config: TableConfig = {};
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() filterChange = new EventEmitter<FilterEvent>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<unknown>();
  @Output() rowSelect = new EventEmitter<unknown[]>();
  @Output() export = new EventEmitter<'csv' | 'excel' | 'pdf'>();
  
  @ContentChild('customCell') customCellTemplate?: TemplateRef<unknown>;
  @ContentChild('customHeader') customHeaderTemplate?: TemplateRef<unknown>;
  @ContentChild('customActions') customActionsTemplate?: TemplateRef<unknown>;

  // Internal state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;
  filters = new Map<string, string>();
  searchTerm = '';
  selectedRows = new Set<unknown>();
  columnFilters = new Map<string, string>();
  pageSize = 10;
  
  // Computed properties
  filteredData: unknown[] = [];
  paginatedData: unknown[] = [];
  totalPages = 0;
  
  // Default configuration
  defaultConfig: TableConfig = {
    searchable: true,
    exportable: false,
    selectable: false,
    striped: true,
    hoverable: true,
    bordered: false,
    compact: false,
    responsive: true,
    loading: false,
    emptyMessage: 'No data available',
    pageSize: 10,
    pageSizes: [5, 10, 25, 50, 100]
  };

  ngOnInit() {
    // Merge default config with provided config
    this.config = { ...this.defaultConfig, ...this.config };
    this.pageSize = this.config.pageSize || 10;
    this.applyFilters();
  }

  ngOnChanges() {
    this.applyFilters();
  }

  // Sorting
  onSort(column: TableColumn) {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      // Toggle sort direction
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = null;
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({
      column: this.sortColumn || '',
      direction: this.sortDirection
    });
    
    this.applyFilters();
  }

  getSortIcon(column: TableColumn): string {
    if (!column.sortable) return '';
    
    if (this.sortColumn !== column.key) {
      return '↕️'; // Unsorted
    }
    
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // Filtering
  onFilter(column: TableColumn, value: string) {
    if (!column.filterable) return;

    if (value) {
      this.columnFilters.set(column.key, value);
    } else {
      this.columnFilters.delete(column.key);
    }

    this.filterChange.emit({
      column: column.key,
      value
    });
    
    this.applyFilters();
  }

  onGlobalSearch(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.data];

    // Apply global search
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(row => {
        return this.columns.some(col => {
          const value = this.getCellValue(row, col);
          return value?.toString().toLowerCase().includes(search);
        });
      });
    }

    // Apply column filters
    this.columnFilters.forEach((value, key) => {
      filtered = filtered.filter(row => {
        const rowData = row as Record<string, unknown>;
        const cellValue = rowData[key];
        // For exact matching (e.g., status), use === comparison
        // For partial matching (e.g., names), use includes
        const column = this.columns.find(col => col.key === key);
        if (column?.type === 'badge' || key === 'status') {
          // Exact match for status/badge fields
          return cellValue?.toString().toLowerCase() === value.toLowerCase();
        } else {
          // Partial match for other fields
          return cellValue?.toString().toLowerCase().includes(value.toLowerCase());
        }
      });
    });

    // Apply sorting
    if (this.sortColumn && this.sortDirection) {
      filtered.sort((a, b) => {
        const aData = a as Record<string, unknown>;
        const bData = b as Record<string, unknown>;
        const aValue = aData[this.sortColumn!];
        const bValue = bData[this.sortColumn!];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue! > bValue! ? 1 : -1;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    this.filteredData = filtered;
    this.totalItems = filtered.length;
    this.updatePagination();
  }

  // Pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
      this.updatePagination();
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.pageSizeChange.emit(size);
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    
    if (this.totalPages <= maxPages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Selection
  toggleRowSelection(row: unknown) {
    if (!this.config.selectable) return;

    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    
    this.rowSelect.emit(Array.from(this.selectedRows));
  }

  toggleAllSelection() {
    if (this.selectedRows.size === this.paginatedData.length) {
      this.selectedRows.clear();
    } else {
      this.paginatedData.forEach(row => this.selectedRows.add(row));
    }
    
    this.rowSelect.emit(Array.from(this.selectedRows));
  }

  isRowSelected(row: unknown): boolean {
    return this.selectedRows.has(row);
  }

  isAllSelected(): boolean {
    return this.paginatedData.length > 0 && 
           this.selectedRows.size === this.paginatedData.length;
  }

  // Cell rendering
  getCellValue(row: unknown, column: TableColumn): unknown {
    const rowData = row as Record<string, unknown>;
    const value = rowData[column.key];
    
    if (column.format) {
      return column.format(value);
    }
    
    if (column.type === 'date' && value) {
      return new Date(value as string | number | Date).toLocaleDateString();
    }
    
    return value;
  }

  getCellClass(column: TableColumn): string {
    const classes = [];
    
    if (column.align) {
      classes.push(`text-${column.align}`);
    }
    
    if (column.type === 'number') {
      classes.push('text-right');
    }
    
    return classes.join(' ');
  }

  // Export functionality
  onExport(format: 'csv' | 'excel' | 'pdf') {
    this.export.emit(format);
    
    // Basic CSV export implementation
    if (format === 'csv') {
      this.exportToCSV();
    }
  }

  private exportToCSV() {
    const headers = this.columns.map(col => col.label).join(',');
    const rows = this.filteredData.map(row => {
      return this.columns.map(col => {
        const value = this.getCellValue(row, col);
        // Escape commas and quotes in CSV
        return `"${(value || '').toString().replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Row actions
  onRowClick(row: unknown) {
    this.rowClick.emit(row);
  }

  // Table classes
  getTableClasses(): string {
    const classes = ['w-full'];
    
    if (this.config.striped) {
      classes.push('table-striped');
    }
    
    if (this.config.hoverable) {
      classes.push('table-hover');
    }
    
    if (this.config.bordered) {
      classes.push('table-bordered');
    }
    
    if (this.config.compact) {
      classes.push('table-compact');
    }
    
    return classes.join(' ');
  }

  // Expose Math for template
  Math = Math;
}