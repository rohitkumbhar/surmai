import { expect } from '@playwright/test';
import dayjs from 'dayjs';

import type { Page } from '@playwright/test';

export interface TripFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  /**
   * Traveller profiles to attach, by the label the select shows. They have to
   * exist already: the field offers the current user's profiles rather than
   * taking free text.
   */
  travellers?: string[];
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

    // Add places
    for (const destination of data.destinations) {
      await this.searchAndSelectDestination(destination);
    }

    for (const traveller of data.travellers ?? []) {
      await this.selectTraveller(traveller);
    }
  }

  /**
   * Picks a traveller profile. The field is a select over the profiles the user
   * owns or manages, so the profile has to have been seeded first.
   */
  async selectTraveller(name: string) {
    const field = this.page.getByRole('combobox', { name: 'Travelers' });
    await field.click();
    await field.fill(name);

    const option = this.page.getByRole('option', { name });
    await expect(option).toBeVisible();
    await option.click();
  }

  /**
   * Search for and select a destination
   */
  async searchAndSelectDestination(destinationName: string) {
    // Click on the destination search field
    await this.page.getByLabel('Destinations').click();

    // Type the destination name
    await this.page.getByLabel('Destinations').fill(destinationName);

    // The options arrive from a search request, so wait for one rather than
    // sleeping and hoping.
    const option = this.page.getByRole('option').first();
    await expect(option).toBeVisible();
    await option.click();
  }

  /**
   * Submits the form and returns the id of the trip that was created, taken
   * from the url the app navigates to.
   */
  async clickCreateTripButton(): Promise<string> {
    await this.page.getByRole('button', { name: 'Create Trip' }).click();
    await this.page.waitForURL(/\/trips\/[^/]+$/);
    return this.page.url().split('/').pop() || '';
  }
}
