import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    if (totalPages <= 1) return null;

    return (
        <div className={styles.pagination}>
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                &laquo; Prev
            </button>
            {pageNumbers.map(number => (
                <button 
                    key={number} 
                    onClick={() => onPageChange(number)}
                    className={currentPage === number ? styles.active : ''}
                >
                    {number}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next &raquo;
            </button>
        </div>
    );
};

export default Pagination;