import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

const renderPagination = (props = {}) =>
  render(
    <Pagination currentPage={1} totalPages={10} onPageChange={vi.fn()} {...props} />,
  );

describe('Pagination', () => {
  it('should render numbered buttons on desktop', () => {
    renderPagination();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  it('should show Previous and Next buttons', () => {
    renderPagination();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should disable Previous on the first page', () => {
    renderPagination({ currentPage: 1 });
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('should disable Next on the last page', () => {
    renderPagination({ currentPage: 10, totalPages: 10 });
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('should call onPageChange when page button is clicked', () => {
    const onPageChange = vi.fn();
    renderPagination({ onPageChange });

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('should calculate correct page numbers to display around current page', () => {
    renderPagination({ currentPage: 5 });

    ['3', '4', '5', '6', '7'].forEach((page) => {
      expect(screen.getByRole('button', { name: page })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
  });

  it('should show current page as active', () => {
    renderPagination({ currentPage: 4 });
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
