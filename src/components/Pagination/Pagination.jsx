import React from 'react';
import './Pagination.css';

const Pagination = ({ pageInfo, onPageChange, onLimitChange }) => {
  const { 
    currentPage, 
    totalPages, 
    itemsPerPage, 
    totalItems,
    startItem,
    endItem,
    hasNextPage,
    hasPrevPage 
  } = pageInfo;

  // Generate page numbers to show (max 5 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
      {/* Results info */}
      <div className="pagination-info">
        <span>
          Showing {startItem} to {endItem} of {totalItems} results
        </span>
      </div>

      {/* Page navigation */}
      <div className="pagination-controls">
        {/* Previous button */}
        <button 
          className="pagination-btn prev-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        {/* Page numbers */}
        <div className="page-numbers">
          {pageNumbers.map(pageNum => (
            <button
              key={pageNum}
              className={`pagination-btn page-btn ${pageNum === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button 
          className="pagination-btn next-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      {/* Items per page selector */}
      <div className="items-per-page">
        <label htmlFor="items-per-page">Show:</label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => onLimitChange(parseInt(e.target.value))}
          className="items-per-page-select"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Page info */}
      <div className="page-info">
        <span>Page {currentPage} of {totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination; 