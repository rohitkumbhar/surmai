import { expect, Page } from '@playwright/test';
import dayjs from 'dayjs';

export interface TripFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  participants: string[];
}

export class CreateNewTripPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the create new trip page
   */
  async goto() {
    await this.page.goto('/trips/create');
  }

  /**
   * Check that all form elements are visible
   */
  async expectFormElementsVisible() {
    // Check basic form elements
    await expect(this.page.getByLabel('Name')).toBeVisible();
    await expect(this.page.getByLabel('Brief Description')).toBeVisible();
    await expect(this.page.getByLabel('Trip Dates')).toBeVisible();

    // Check the destination selector is visible
    await expect(this.page.getByText('Enter some basic information about your trip to get started')).toBeVisible();

    // Check the Create Trip button is visible
    await expect(this.page.getByRole('button', { name: 'Create Trip' })).toBeVisible();
  }

  /**
   * Fill the trip form with the provided data
   */
  async fillTripForm(data: TripFormData) {
    // Fill in the name
    await this.page.getByLabel('Name').fill(data.name);

    // Fill in the description if provided
    if (data.description) {
      await this.page.getByLabel('Brief Description').fill(data.description);
    }

    // Set the date range
    const startDateStr = dayjs(data.startDate).format('D MMMM YYYY');
    const endDateStr = dayjs(data.endDate).format('D MMMM YYYY');
    await this.page.click('[data-testid="trip-dates"]');
    await this.page.click(`button[aria-label="${startDateStr}"]`);
    await this.page.click(`button[aria-label="${endDateStr}"]`);

    // Add destinations
    for (const destination of data.destinations) {
      await this.searchAndSelectDestination(destination);
    }

    // Add participants
    for (const participant of data.participants) {
      await this.page.getByRole('textbox', { name: 'Travellers' }).click();
      await this.page.getByRole('textbox', { name: 'Travellers' }).fill(participant);
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * Search for and select a destination
   */
  async searchAndSelectDestination(destinationName: string) {
    // Click on the destination search field
    await this.page.getByLabel('Destinations').click();

    // Type the destination name
    await this.page.getByLabel('Destinations').fill(destinationName);

    // Wait for the search results to appear
    await this.page.waitForTimeout(500); // Small delay to allow search to complete

    // Click on the first search result
    await this.page.getByRole('option').first().click();
  }

  /**
   * Click the Create Trip button
   */
  async clickCreateTripButton() {
    await this.page.getByRole('button', { name: 'Create Trip' }).click();
  }
}
