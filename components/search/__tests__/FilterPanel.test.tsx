import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel, SearchFilters } from '../FilterPanel';

const REGION_LABELS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

describe('FilterPanel', () => {

  it('should render content type filter buttons', () => {
    render(<FilterPanel onFilterChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '관광지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '음식점' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '숙박' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '행사' })).toBeInTheDocument();
  });

  it('should highlight selected content type', () => {
    render(
      <FilterPanel onFilterChange={vi.fn()} activeFilters={{ contentType: 12 }} />,
    );
    const selected = screen.getByRole('button', { name: '관광지' });
    expect(selected).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call onFilterChange when content type clicked', () => {
    const onFilterChange = vi.fn();
    render(<FilterPanel onFilterChange={onFilterChange} />);

    const button = screen.getByRole('button', { name: '음식점' });
    fireEvent.click(button);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 39 }),
    );
  });

  it('should render region dropdown with 17 provinces', () => {
    render(<FilterPanel onFilterChange={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: /지역/i });
    expect(select).toBeInTheDocument();

    REGION_LABELS.forEach((label) => {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    });
  });

  it('should apply filter when region selected', () => {
    const onFilterChange = vi.fn();
    render(<FilterPanel onFilterChange={onFilterChange} />);

    const select = screen.getByRole('combobox', { name: /지역/i });
    fireEvent.change(select, { target: { value: '31' } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ areaCode: 31 }),
    );
  });

  it('should show applied filters as removable chips', () => {
    const activeFilters: SearchFilters = {
      contentType: 12,
      areaCode: 31,
      categories: ['nature'],
    };

    render(<FilterPanel onFilterChange={vi.fn()} activeFilters={activeFilters} />);

    expect(screen.getByText('관광지')).toBeInTheDocument();
    expect(screen.getByText('경기도')).toBeInTheDocument();
    expect(screen.getByText('nature')).toBeInTheDocument();
  });

  it('should remove individual filter when chip clear clicked', () => {
    const onFilterChange = vi.fn();
    const activeFilters: SearchFilters = { areaCode: 31 };
    render(<FilterPanel onFilterChange={onFilterChange} activeFilters={activeFilters} />);

    const removeButton = screen.getByRole('button', {
      name: /remove filter 경기도/i,
    });

    fireEvent.click(removeButton);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ areaCode: undefined }),
    );
  });

  it('should show Clear All button when filters active', () => {
    render(
      <FilterPanel onFilterChange={vi.fn()} activeFilters={{ contentType: 12 }} />,
    );
    expect(
      screen.getByRole('button', { name: /clear all filters/i }),
    ).toBeInTheDocument();
  });

  it('should reset filters when Clear All clicked', () => {
    const onFilterChange = vi.fn();
    render(
      <FilterPanel
        onFilterChange={onFilterChange}
        activeFilters={{ contentType: 12, areaCode: 31, categories: ['nature'] }}
      />,
    );

    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    expect(onFilterChange).toHaveBeenCalledWith({});
  });
});
