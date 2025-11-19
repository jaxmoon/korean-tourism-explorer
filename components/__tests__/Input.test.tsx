import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../ui/Input';

describe('Input Component', () => {
  it('should render input field', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should render with label', () => {
    render(<Input label="Email Address" />);
    const label = screen.getByText(/email address/i);
    expect(label).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<Input error="This field is required" label="Username" />);
    const errorMessage = screen.getByText(/this field is required/i);
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-error');
  });

  it('should show helper text', () => {
    render(<Input helperText="Enter your email" label="Email" />);
    const helperText = screen.getByText(/enter your email/i);
    expect(helperText).toBeInTheDocument();
  });

  it('should not show helper text when error is present', () => {
    render(
      <Input
        error="Invalid email"
        helperText="Enter your email"
        label="Email"
      />
    );
    const errorMessage = screen.getByText(/invalid email/i);
    expect(errorMessage).toBeInTheDocument();
    expect(screen.queryByText(/enter your email/i)).not.toBeInTheDocument();
  });

  it('should have proper ARIA attributes for error state', () => {
    render(<Input error="Required" label="Name" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should associate label with input via id', () => {
    render(<Input label="Email" id="email-input" />);
    const input = screen.getByRole('textbox');
    const label = screen.getByText(/email/i);
    expect(input).toHaveAttribute('id', 'email-input');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('should have focus ring for accessibility', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus:ring-2');
  });
});
