import { expect, Page } from '@playwright/test';
import dayjs from 'dayjs';

export interface TripFormData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
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

    const startDateStr = dayjs(data.startDate).format('D MMMM YYYY'); //`${data.startDate.getMonth() + 1}/${data.startDate.getDate()}/${data.startDate.getFullYear()}`;
    const endDateStr = dayjs(data.endDate).format('D MMMM YYYY'); //`${data.endDate.getMonth() + 1}/${data.endDate.getDate()}/${data.endDate.getFullYear()}`;

    // await this.page.getByLabel('Trip Dates').click();
    // await this.page.getByLabel('Trip Dates').fill(`${startDateStr} - ${endDateStr}`);
    // await this.page.keyboard.press('Enter');

    //
    await this.page.click('[data-testid="trip-dates"]'); // Use a test ID or placeholder
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
    // await this.page.route(
    //   (url: URL) => {
    //     console.log('url.href =>', url.href);
    //     return true;
    //   },
    //   async (route) => {
    //     // console.log('route.request().url() =>', route.request().url());
    //     if (route.request().url().includes('places')) {
    //       await route.fulfill({
    //         status: 200,
    //         contentType: 'application/json',
    //         body: JSON.stringify({
    //           page: 1,
    //           perPage: 10,
    //           totalItems: 1,
    //           totalPages: 1,
    //           items: [
    //             {
    //               id: 'dest1',
    //               name: 'New York',
    //               stateName: 'NY',
    //               countryName: 'USA',
    //               latitude: 40.7128,
    //               longitude: -74.006,
    //               timezone: 'America/New_York',
    //             },
    //           ],
    //         }),
    //       });
    //     } else {
    //       await route.continue();
    //     }
    //   }
    // );

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
