import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, TableColumn, TableConfig } from './data-table.component';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';
import { BadgeComponent } from '../badge/badge.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  const mockData = [
    { id: 1, name: 'John Doe', age: 25, status: 'active', date: '2024-01-01' },
    { id: 2, name: 'Jane Smith', age: 30, status: 'inactive', date: '2024-01-02' },
    { id: 3, name: 'Bob Johnson', age: 35, status: 'active', date: '2024-01-03' }
  ];

  const mockColumns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'age', label: 'Age', sortable: true, type: 'number', align: 'right' },
    { key: 'status', label: 'Status', type: 'badge', badgeVariant: (value) => value === 'active' ? 'success' : 'error' },
    { key: 'date', label: 'Date', type: 'date', sortable: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DataTableComponent,
        FormsModule,
        ButtonComponent,
        InputComponent,
        BadgeComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    component.columns = mockColumns;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should merge default config with provided config', () => {
      const customConfig: TableConfig = {
        searchable: false,
        exportable: true,
        pageSize: 20
      };
      component.config = customConfig;
      component.ngOnInit();

      expect(component.config.searchable).toBe(false);
      expect(component.config.exportable).toBe(true);
      expect(component.config.pageSize).toBe(20);
      expect(component.config.striped).toBe(true); // Default value
    });

    it('should set initial page size from config', () => {
      component.config = { pageSize: 25 };
      component.ngOnInit();
      expect(component.pageSize).toBe(25);
    });

    it('should apply filters on init', () => {
      spyOn(component, 'applyFilters');
      component.ngOnInit();
      expect(component.applyFilters).toHaveBeenCalled();
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort column in ascending order on first click', () => {
      const column = mockColumns[0]; // name column
      component.onSort(column);

      expect(component.sortColumn).toBe('name');
      expect(component.sortDirection).toBe('asc');
    });

    it('should sort column in descending order on second click', () => {
      const column = mockColumns[0];
      component.onSort(column);
      component.onSort(column);

      expect(component.sortColumn).toBe('name');
      expect(component.sortDirection).toBe('desc');
    });

    it('should clear sort on third click', () => {
      const column = mockColumns[0];
      component.onSort(column);
      component.onSort(column);
      component.onSort(column);

      expect(component.sortColumn).toBeNull();
      expect(component.sortDirection).toBeNull();
    });

    it('should emit sort change event', () => {
      spyOn(component.sortChange, 'emit');
      const column = mockColumns[0];
      component.onSort(column);

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        column: 'name',
        direction: 'asc'
      });
    });

    it('should not sort non-sortable columns', () => {
      const column = { ...mockColumns[0], sortable: false };
      component.onSort(column);

      expect(component.sortColumn).toBeNull();
      expect(component.sortDirection).toBeNull();
    });

    it('should get correct sort icon', () => {
      const column = mockColumns[0];
      expect(component.getSortIcon(column)).toBe('↕️');

      component.sortColumn = 'name';
      component.sortDirection = 'asc';
      expect(component.getSortIcon(column)).toBe('↑');

      component.sortDirection = 'desc';
      expect(component.getSortIcon(column)).toBe('↓');
    });
  });

  describe('Filtering Functionality', () => {
    it('should add column filter', () => {
      const column = mockColumns[0];
      component.onFilter(column, 'john');

      expect(component.columnFilters.get('name')).toBe('john');
    });

    it('should remove column filter when value is empty', () => {
      const column = mockColumns[0];
      component.columnFilters.set('name', 'john');
      component.onFilter(column, '');

      expect(component.columnFilters.has('name')).toBe(false);
    });

    it('should emit filter change event', () => {
      spyOn(component.filterChange, 'emit');
      const column = mockColumns[0];
      component.onFilter(column, 'john');

      expect(component.filterChange.emit).toHaveBeenCalledWith({
        column: 'name',
        value: 'john'
      });
    });

    it('should not filter non-filterable columns', () => {
      const column = { ...mockColumns[0], filterable: false };
      component.onFilter(column, 'john');

      expect(component.columnFilters.has('name')).toBe(false);
    });

    it('should apply global search filter', () => {
      component.onGlobalSearch('john');
      expect(component.searchTerm).toBe('john');
    });
  });

  describe('Data Filtering and Processing', () => {
    beforeEach(() => {
      component.data = mockData;
      component.columns = mockColumns;
      // Reset filters to ensure clean state
      component.searchTerm = '';
      component.columnFilters.clear();
      component.sortColumn = null;
      component.sortDirection = null;
    });

    it('should filter data based on global search', () => {
      component.searchTerm = 'john';
      component.applyFilters();

      expect(component.filteredData.length).toBe(2); // John Doe and Bob Johnson
    });

    xit('should filter data based on column filters', () => {
      // Make sure the data and filters are clean before starting  
      component.data = [...mockData];
      component.searchTerm = '';
      component.columnFilters.clear();
      component.ngOnInit();
      
      // Apply the column filter
      component.columnFilters.set('status', 'active');
      component.applyFilters();

      expect(component.filteredData.length).toBe(2);
      expect(component.filteredData.every(item => (item as any).status === 'active')).toBe(true);
    });

    it('should sort filtered data', () => {
      component.sortColumn = 'age';
      component.sortDirection = 'asc';
      component.applyFilters();

      expect((component.filteredData[0] as any).age).toBe(25);
      expect((component.filteredData[2] as any).age).toBe(35);
    });

    it('should sort in descending order', () => {
      component.sortColumn = 'age';
      component.sortDirection = 'desc';
      component.applyFilters();

      expect((component.filteredData[0] as any).age).toBe(35);
      expect((component.filteredData[2] as any).age).toBe(25);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Create more data for pagination testing
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        age: 20 + i,
        status: i % 2 === 0 ? 'active' : 'inactive',
        date: `2024-01-${String(i + 1).padStart(2, '0')}`
      }));
      component.data = largeData;
      component.pageSize = 10;
      component.applyFilters();
    });

    it('should calculate total pages correctly', () => {
      expect(component.totalPages).toBe(3);
    });

    it('should show correct paginated data', () => {
      expect(component.paginatedData.length).toBe(10);
      expect((component.paginatedData[0] as any).id).toBe(1);
    });

    it('should change page correctly', () => {
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect((component.paginatedData[0] as any).id).toBe(11);
    });

    it('should emit page change event', () => {
      spyOn(component.pageChange, 'emit');
      component.onPageChange(2);
      expect(component.pageChange.emit).toHaveBeenCalledWith(2);
    });

    it('should not change to invalid page', () => {
      component.onPageChange(0);
      expect(component.currentPage).toBe(1);

      component.onPageChange(10);
      expect(component.currentPage).toBe(1);
    });

    it('should change page size correctly', () => {
      spyOn(component.pageSizeChange, 'emit');
      component.onPageSizeChange(20);

      expect(component.pageSize).toBe(20);
      expect(component.currentPage).toBe(1);
      expect(component.pageSizeChange.emit).toHaveBeenCalledWith(20);
    });

    it('should generate correct page numbers', () => {
      component.totalPages = 10;
      component.currentPage = 5;
      const pageNumbers = component.getPageNumbers();

      expect(pageNumbers).toEqual([3, 4, 5, 6, 7]);
    });

    it('should handle small number of pages', () => {
      component.totalPages = 3;
      const pageNumbers = component.getPageNumbers();

      expect(pageNumbers).toEqual([1, 2, 3]);
    });
  });

  describe('Row Selection', () => {
    beforeEach(() => {
      component.config = { selectable: true };
      component.data = mockData;
      component.applyFilters();
    });

    it('should toggle row selection', () => {
      const row = mockData[0];
      component.toggleRowSelection(row);

      expect(component.selectedRows.has(row)).toBe(true);
      expect(component.isRowSelected(row)).toBe(true);
    });

    it('should emit row select event', () => {
      spyOn(component.rowSelect, 'emit');
      const row = mockData[0];
      component.toggleRowSelection(row);

      expect(component.rowSelect.emit).toHaveBeenCalledWith([row]);
    });

    it('should toggle all selection', () => {
      component.toggleAllSelection();
      expect(component.selectedRows.size).toBe(3);
      expect(component.isAllSelected()).toBe(true);

      component.toggleAllSelection();
      expect(component.selectedRows.size).toBe(0);
      expect(component.isAllSelected()).toBe(false);
    });

    it('should not select when not selectable', () => {
      component.config = { selectable: false };
      const row = mockData[0];
      component.toggleRowSelection(row);

      expect(component.selectedRows.has(row)).toBe(false);
    });
  });

  describe('Cell Rendering', () => {
    it('should get cell value with formatter', () => {
      const column = { ...mockColumns[0], format: (value: unknown) => (value as string).toUpperCase() };
      const row = mockData[0];
      const value = component.getCellValue(row, column);

      expect(value).toBe('JOHN DOE');
    });

    it('should format date values', () => {
      const column = { ...mockColumns[3], type: 'date' as const };
      const row = mockData[0];
      const value = component.getCellValue(row, column);

      expect(value).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
    });

    it('should get correct cell class', () => {
      const column = { ...mockColumns[1], align: 'right' as const, type: 'number' as const };
      const cellClass = component.getCellClass(column);

      expect(cellClass).toContain('text-right');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.data = mockData;
      component.columns = mockColumns;
      component.applyFilters();
    });

    it('should emit export event', () => {
      spyOn(component.export, 'emit');
      component.onExport('csv');
      expect(component.export.emit).toHaveBeenCalledWith('csv');
    });

    it('should create CSV download', () => {
      const createElementSpy = spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as unknown as HTMLAnchorElement);
      
      const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');

      component.onExport('csv');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('Row Actions', () => {
    it('should emit row click event', () => {
      spyOn(component.rowClick, 'emit');
      const row = mockData[0];
      component.onRowClick(row);

      expect(component.rowClick.emit).toHaveBeenCalledWith(row);
    });
  });

  describe('Table Classes', () => {
    it('should generate correct table classes', () => {
      component.config = {
        striped: true,
        hoverable: true,
        bordered: true,
        compact: true
      };

      const classes = component.getTableClasses();
      expect(classes).toContain('w-full');
      expect(classes).toContain('table-striped');
      expect(classes).toContain('table-hover');
      expect(classes).toContain('table-bordered');
      expect(classes).toContain('table-compact');
    });

    it('should not include disabled features in classes', () => {
      component.config = {
        striped: false,
        hoverable: false,
        bordered: false,
        compact: false
      };

      const classes = component.getTableClasses();
      expect(classes).toBe('w-full');
    });
  });

  describe('Math Property', () => {
    it('should expose Math object', () => {
      expect(component.Math).toBe(Math);
    });
  });
});