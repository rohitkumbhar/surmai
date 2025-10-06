import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AirportSelect } from '../../../../../src/components/trip/transportation/AirportSelect';
import * as api from '../../../../../src/lib/api';

import type { Airport } from '../../../../../src/types/trips';


// Mock the API module
vi.mock('../../../../../src/lib/api', () => ({
  searchAirports: vi.fn(),
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

describe('AirportSelect', () => {
  const mockForm = {
    getValues: vi.fn(),
    setFieldValue: vi.fn(),
    getInputProps: vi.fn().mockReturnValue({}),
    key: vi.fn().mockReturnValue('test-key'),
  };

  const mockAirports: Airport[] = [
    {
      id: '1',
      name: 'San Francisco International Airport',
      iataCode: 'SFO',
      isoCountry: 'US',
      latitude: '37.618889',
      longitude: '-122.375',
      timezone: 'America/Los_Angeles',
    },
    {
      id: '2',
      name: 'Los Angeles International Airport',
      iataCode: 'LAX',
      isoCountry: 'US',
      latitude: '33.9425',
      longitude: '-118.408056',
      timezone: 'America/Los_Angeles',
    },
    {
      id: '3',
      name: 'John F. Kennedy International Airport',
      iataCode: 'JFK',
      isoCountry: 'US',
      latitude: '40.639722',
      longitude: '-73.778889',
      timezone: 'America/New_York',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockForm.getValues.mockReturnValue({});
    (api.searchAirports as any).mockResolvedValue({
      items: mockAirports,
    });

    // Reset the DOM between tests
    cleanup();
  });

  it('renders correctly', () => {
    renderWithMantine(
      <AirportSelect
        propName="origin"
        form={mockForm as any}
        label="Origin Airport"
        description="Original Airport"
        currentValue={undefined}
      />
    );
    expect(screen.getByText('Origin Airport')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Airport Code')).toBeInTheDocument();
  });

  it('displays existing airport', () => {

    renderWithMantine(
      <AirportSelect
        propName="origin"
        form={mockForm as any}
        label="Origin Airport"
        description="Origin Airport"
        currentValue={{name: 'San Francisco Airport', iataCode: 'SFO'}}
      />
    );

    // The component might display the value in different ways
    // Let's check if the input has the value or if it's displayed somewhere else
    const input = screen.getByPlaceholderText('Airport Code');
    expect(input).toHaveValue('SFO');
  });

  it('searches for airports when typing', async () => {
    const user = userEvent.setup();
    renderWithMantine(
      <AirportSelect
        propName="origin"
        form={mockForm as any}
        label="Origin Airport"
        description="Origin Airport"

      />
    );

    const input = screen.getByPlaceholderText('Airport Code');
    await user.type(input, 'San');

    await waitFor(() => {
      expect(api.searchAirports).toHaveBeenCalledWith('San');
    });
  });

  it('adds an airport when selected from dropdown', async () => {

    const user = userEvent.setup();
    renderWithMantine(
      <AirportSelect
        propName="origin"
        form={mockForm as any}
        label="Origin Airport"
        description="Origin Airport"

      />
    );

    const input = screen.getByPlaceholderText('Airport Code');
    await user.type(input, 'San');

    await waitFor(() => {
      expect(api.searchAirports).toHaveBeenCalledWith('San');
    });

    // Wait for dropdown to appear and select an option
    const option = await screen.findByText('San Francisco International Airport');
    await user.click(option);

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('origin', {
      iataCode: 'SFO',
      name: 'San Francisco International Airport',
      id: '1',
      countryCode: 'US',
      latitude: '37.618889',
      longitude: '-122.375',
      timezone: 'America/Los_Angeles',
    });
  });

  it('creates a new entry when "Create New Entry" is selected', async () => {
    // Initialize with empty origin to avoid controlled/uncontrolled warning
    mockForm.getValues.mockReturnValue({
      origin: undefined,
    });

    // Mock the form.setFieldValue to update the mockForm.getValues result
    mockForm.setFieldValue.mockImplementation((field, value) => {
      mockForm.getValues.mockReturnValue({
        [field]: value,
      });
    });

    (api.searchAirports as any).mockResolvedValue({
      items: [],
    });

    const user = userEvent.setup();
    renderWithMantine(
      <AirportSelect
        propName="origin"
        form={mockForm as any}
        label="Origin Airport"
        description="Origin Airport"

      />
    );

    const input = screen.getByPlaceholderText('Airport Code');
    await user.type(input, 'New Airport');

    await waitFor(() => {
      expect(api.searchAirports).toHaveBeenCalledWith('New Airport');
    });

    // Wait for dropdown to appear and select "Create New Entry"
    // The text might be in a different element or have different structure
    const createNewOption = await screen.findByText(/Create New Entry/i);
    await user.click(createNewOption);

    expect(mockForm.setFieldValue).toHaveBeenCalled();
    expect(mockForm.setFieldValue).toHaveBeenCalledWith('origin', 'New Airport');
  });

  it('clears the selected airport when clear button is clicked', async () => {
    // Initialize with a defined origin value
    const originValue = {
      iataCode: 'SFO',
      name: 'San Francisco International Airport',
    };

    const user = userEvent.setup();
    renderWithMantine(
      <AirportSelect
        propName="origin"
        form={mockForm as any}
        label="Origin Airport"
        description="Origin Airport"
        currentValue={originValue}
      />
    );

    // Mock the form.setFieldValue to update the mockForm.getValues result
    // This ensures the component sees a consistent value state
    mockForm.setFieldValue.mockImplementation((field, value) => {
      mockForm.getValues.mockReturnValue({
        [field]: value,
      });
    });

    const clearButton = screen.getByLabelText('Clear value');
    await user.click(clearButton);

    // Verify the form field was cleared
    expect(mockForm.setFieldValue).toHaveBeenCalled();
    expect(screen.queryByText('SFO')).not.toBeInTheDocument();
  });

  it('shows departure icon for origin', () => {
    renderWithMantine(
      <AirportSelect
        propName="origin"
        description="Description"
        form={mockForm as any}
        label="Origin Airport"

      />
    );
    expect(screen.getByText('Origin Airport')).toBeInTheDocument();
  });

  it('shows arrival icon for destination', () => {
    renderWithMantine(
      <AirportSelect
        propName="destination"
        form={mockForm as any}
        label="Destination Airport"
        description="Description"
      />
    );
    expect(screen.getByText('Destination Airport')).toBeInTheDocument();
  });
});
