import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DestinationSelect } from '../../../../src/components/destinations/DestinationSelect.js';
import * as api from '../../../../src/lib/api';
import { Destination } from '../../../../src/types/trips';
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

describe('DestinationSelect', () => {
  const mockForm = {
    getValues: vi.fn(),
    setFieldValue: vi.fn(),
    getInputProps: vi.fn().mockReturnValue({}),
    key: vi.fn().mockReturnValue('test-key'),
  };

  const mockDestinations: Destination[] = [
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
      items: mockDestinations,
    });
  });

  it('renders correctly', () => {
    renderWithMantine(<DestinationSelect propName="destinations" form={mockForm as any} />);
    expect(screen.getByText('Destinations')).toBeInTheDocument();
    expect(screen.getByText('Enter the destinations in this trip e.g. San Jose, Guanacaste')).toBeInTheDocument();
  });

  it('displays existing destinations', () => {
    mockForm.getValues.mockReturnValue({
      destinations: [mockDestinations[0]],
    });

    renderWithMantine(<DestinationSelect propName="destinations" form={mockForm as any} />);
    expect(screen.getByText('San Jose')).toBeInTheDocument();
  });

  it('searches for destinations when typing', async () => {
    const user = userEvent.setup();
    renderWithMantine(<DestinationSelect propName="destinations" form={mockForm as any} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'San');

    await waitFor(() => {
      expect(api.searchPlaces).toHaveBeenCalledWith('San');
    });
  });

  it('adds a destination when selected from dropdown', async () => {
    const user = userEvent.setup();
    renderWithMantine(<DestinationSelect propName="destinations" form={mockForm as any} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'San');

    await waitFor(() => {
      expect(api.searchPlaces).toHaveBeenCalledWith('San');
    });

    // Wait for dropdown to appear and select an option
    const option = await screen.findByText('San Jose');
    await user.click(option);

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('destinations', [mockDestinations[0]]);
  });

  it('creates a new destination when "Create New Entry" is selected', async () => {
    const user = userEvent.setup();
    renderWithMantine(<DestinationSelect propName="destinations" form={mockForm as any} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'New Destination');

    await waitFor(() => {
      expect(api.searchPlaces).toHaveBeenCalledWith('New Destination');
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
      destinations: [mockDestinations[0]],
    });

    const user = userEvent.setup();
    renderWithMantine(<DestinationSelect propName="destinations" form={mockForm as any} />);

    const removeButton = screen.getByRole('button');
    await user.click(removeButton);

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('destinations', []);
  });
});
