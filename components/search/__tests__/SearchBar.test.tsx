import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render search input with placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} placeholder="Search destinations" />);
    expect(
      screen.getByPlaceholderText('Search destinations'),
    ).toBeInTheDocument();
  });

  it('should debounce input changes (300ms delay)', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Seoul' } });

    vi.advanceTimersByTime(250);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(onSearch).toHaveBeenCalledWith('Seoul');
  });

  it('should NOT call onSearch immediately on input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Busan' } });

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('should call onSearch after 300ms with debounced value', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Jeju' } });

    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith('Jeju');
  });

  it('should show clear button when input has value', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Gyeonggi' } });

    expect(
      screen.getByRole('button', { name: /clear search/i }),
    ).toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Daegu' } });

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });

  it('should show search suggestions dropdown when typing', () => {
    localStorage.setItem(
      'search_history',
      JSON.stringify(['Seoul Tower', 'Busan Beach']),
    );

    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Seoul' } });

    expect(screen.getByText('Seoul Tower')).toBeInTheDocument();
  });

  it('should hide suggestions when input is cleared', () => {
    localStorage.setItem(
      'search_history',
      JSON.stringify(['Jeju Island', 'Han River']),
    );

    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Jeju' } });
    expect(screen.getByText('Jeju Island')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText('Jeju Island')).not.toBeInTheDocument();
  });

  it('should handle suggestion click', () => {
    const onSearch = vi.fn();
    localStorage.setItem(
      'search_history',
      JSON.stringify(['Bukchon Hanok', 'Gwangalli Beach']),
    );

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Buk' } });

    const suggestion = screen.getByRole('button', {
      name: /use suggestion bukchon hanok/i,
    });

    fireEvent.click(suggestion);

    expect(input).toHaveValue('Bukchon Hanok');
    expect(onSearch).toHaveBeenCalledWith('Bukchon Hanok');
  });
});
