import { useMantineColorScheme } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';

import { DarkModeToggle } from '../../../../src/components/darkmodetoggle/DarkModeToggle';

vi.mock('@mantine/core', () => ({
  useMantineColorScheme: vi.fn(),
  ActionIcon: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} data-testid="action-icon">
      {children}
    </button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('@tabler/icons-react', () => ({
  IconSun: () => <span data-testid="sun-icon">Sun Icon</span>,
  IconMoon: () => <span data-testid="moon-icon">Moon Icon</span>,
}));

const mockUseMantineColorScheme = vi.mocked(useMantineColorScheme);

describe('DarkModeToggle', () => {
  const mockSetColorScheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to light mode
    mockUseMantineColorScheme.mockReturnValue({
      colorScheme: 'light',
      setColorScheme: mockSetColorScheme,
      clearColorScheme: function (): void {
        throw new Error('Function not implemented.');
      },
      toggleColorScheme: function (): void {
        throw new Error('Function not implemented.');
      },
    });
  });

  describe('Rendering', () => {
    it('renders without errors', () => {
      render(<DarkModeToggle />);
      expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });

    it('has correct accessibility label', () => {
      render(<DarkModeToggle />);
      expect(screen.getByLabelText('Dark Mode Toggle')).toBeInTheDocument();
    });
  });

  describe('Icon display based on color scheme', () => {
    it('displays moon icon when in light mode', () => {
      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'light',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    });

    it('displays sun icon when in dark mode', () => {
      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'dark',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
    });

    it('displays sun icon when system prefers dark mode and colorScheme is auto', () => {
      // Mock window.matchMedia for dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
        })),
      });

      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'auto',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });

    it('displays moon icon when system prefers light mode and colorScheme is auto', () => {
      // Mock window.matchMedia for light mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false, // Prefers light mode
          media: query,
        })),
      });

      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'auto',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('handles missing window.matchMedia gracefully by defaulting to light mode', () => {
      const originalMatchMedia = window.matchMedia;

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });

      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'auto',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      // Should default to light mode (moon icon) when matchMedia is not available
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    });
  });

  describe('User interactions', () => {
    it('calls setColorScheme with "light" when clicking in dark mode', () => {
      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'dark',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      fireEvent.click(screen.getByTestId('action-icon'));

      expect(mockSetColorScheme).toHaveBeenCalledWith('light');
    });

    it('calls setColorScheme with "dark" when clicking in light mode', () => {
      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'light',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        }
      });

      render(<DarkModeToggle />);

      fireEvent.click(screen.getByTestId('action-icon'));

      expect(mockSetColorScheme).toHaveBeenCalledWith('dark');
    });

    it('calls setColorScheme with "light" when clicking in auto mode with dark system preference', () => {
      // Mock dark system preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
        })),
      });

      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'auto',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      fireEvent.click(screen.getByTestId('action-icon'));

      expect(mockSetColorScheme).toHaveBeenCalledWith('light');
    });

    it('calls setColorScheme with "dark" when clicking in auto mode with light system preference', () => {
      // Mock light system preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
        })),
      });

      mockUseMantineColorScheme.mockReturnValue({
        colorScheme: 'auto',
        setColorScheme: mockSetColorScheme,
        clearColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
        toggleColorScheme: function (): void {
          throw new Error('Function not implemented.');
        },
      });

      render(<DarkModeToggle />);

      fireEvent.click(screen.getByTestId('action-icon'));

      expect(mockSetColorScheme).toHaveBeenCalledWith('dark');
    });
  });
});