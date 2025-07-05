import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceMultiSelect } from '../../../../src/components/places/PlaceMultiSelect.tsx';
import * as api from '../../../../src/lib/api';
import { Place } from '../../../../src/types/trips';
import { MantineProvider } from '@mantine/core';

// Mock the API module
vi.mock('../../../../src/lib/api', () => ({
  searchPlaces: vi.fn(),
}));

// Mock the i18next module
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_: string, fallback: string) => fallback,
  }),
}));

// Wrapper function to render components with MantineProvider
const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PlacesMultiSelect', () => {
  const mockForm = {
    getValues: vi.fn(),
    setFieldValue: vi.fn(),
    getInputProps: vi.fn().mockReturnValue({}),
    key: vi.fn().mockReturnValue('test-key'),
  };

  const mockPlaces: Place[] = [
    {
      id: '1',
      name: 'San Jose',
      stateName: 'California',
      countryName: 'USA',
    },
    {
      id: '2',
      name: 'San Francisco',
      stateName: 'California',
      countryName: 'USA',
    },
    {
      id: '3',
      name: 'San Diego',
      stateName: 'California',
      countryName: 'USA',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockForm.getValues.mockReturnValue({
      destinations: [],
    });
    (api.searchPlaces as any).mockResolvedValue({
      items: mockPlaces,
    });
  });

  it('renders correctly', () => {
    renderWithMantine(<PlaceMultiSelect propName="destinations" form={mockForm as any} />);
    expect(screen.getByText('Destinations')).toBeInTheDocument();
    expect(screen.getByText('Enter the destinations in this trip e.g. San Jose, Guanacaste')).toBeInTheDocument();
  });

  it('displays existing places', () => {
    mockForm.getValues.mockReturnValue({
      destinations: [mockPlaces[0]],
    });

    renderWithMantine(<PlaceMultiSelect propName="destinations" form={mockForm as any} />);
    expect(screen.getByText('San Jose')).toBeInTheDocument();
  });

  it('searches for places when typing', async () => {
    const user = userEvent.setup();
    renderWithMantine(<PlaceMultiSelect propName="destinations" form={mockForm as any} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'San');

    await waitFor(() => {
      expect(api.searchPlaces).toHaveBeenCalledWith('San', 1, 20);
    });
  });

  it('adds a destination when selected from dropdown', async () => {
    const user = userEvent.setup();
    renderWithMantine(<PlaceMultiSelect propName="destinations" form={mockForm as any} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'San');

    await waitFor(() => {
      expect(api.searchPlaces).toHaveBeenCalledWith('San', 1, 20);
    });

    // Wait for dropdown to appear and select an option
    const option = await screen.findByText('San Jose');
    await user.click(option);

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('destinations', [mockPlaces[0]]);
  });

  it('creates a new destination when "Create New Entry" is selected', async () => {
    const user = userEvent.setup();
    renderWithMantine(<PlaceMultiSelect propName="destinations" form={mockForm as any} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'New Destination');

    await waitFor(() => {
      expect(api.searchPlaces).toHaveBeenCalledWith('New Destination', 1, 20);
    });

    // Wait for dropdown to appear and select "Create New Entry"
    const createNewOption = await screen.findByText('Create New Entry');
    await user.click(createNewOption);

    expect(mockForm.setFieldValue).toHaveBeenCalled();
    const setFieldValueCall = mockForm.setFieldValue.mock.calls[0];
    expect(setFieldValueCall[0]).toBe('destinations');
    expect(setFieldValueCall[1][0].name).toBe('New Destination');
    expect(setFieldValueCall[1][0].id).toContain('create_new_');
  });

  it.skip('removes a destination when remove button is clicked', async () => {
    mockForm.getValues.mockReturnValue({
      destinations: [mockPlaces[0]],
    });

    const user = userEvent.setup();
    renderWithMantine(<PlaceMultiSelect propName="destinations" form={mockForm as any} />);

    const removeButton = screen.getByRole('button');
    await user.click(removeButton);

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('destinations', []);
  });
});
