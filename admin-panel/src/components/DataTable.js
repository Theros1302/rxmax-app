import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function DataTable({
  title,
  data,
  columns,
  onRowClick = null,
  searchableFields = [],
  filterField = null,
  filterOptions = [],
  pageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Filter data based on search and filter
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm && searchableFields.length > 0) {
      result = result.filter((item) =>
        searchableFields.some(field =>
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filter
    if (filterValue && filterField) {
      result = result.filter((item) => item[filterField] === filterValue);
    }

    return result;
  }, [data, searchTerm, filterValue, searchableFields, filterField]);

  // Paginate
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValue]);

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <div className="data-table-title">{title}</div>
        <div className="data-table-controls">
          {searchableFields.length > 0 && (
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          {filterField && filterOptions.length > 0 && (
            <select
              className="filter-select"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            >
              <option value="">All {filterField}</option>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px', color: '#78909C' }}>
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default DataTable;
