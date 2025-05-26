import { expect, Page } from '@playwright/test';
import dayjs from 'dayjs';
import { getSelectorString } from './helper.ts';

export class ViewTripPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific trip page
   */
  async goto(tripId: string) {
    await this.page.goto(`/trips/${tripId}`);
  }

  /**
   * Check that the trip details are visible
   */
  async expectTripDetailsVisible(tripName: string) {
    await expect(this.page.locator('#app-header').getByText(tripName)).toBeVisible();
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tabName: 'Organization' | 'Itinerary' | 'Attachments' | 'Notes') {
    await this.page.getByRole('tab', { name: tabName }).click();
  }

  /**
   * Open an accordion section in the Organization tab
   */
  async openAccordionSection(sectionName: 'Basic Information' | 'Transportation' | 'Lodging' | 'Activities') {
    // First make sure we're on the Organization tab
    await this.switchToTab('Organization');

    // Find and click the accordion section
    const accordionControl = this.page.getByRole('button', { name: new RegExp(sectionName, 'i') });
    const isExpanded = (await accordionControl.getAttribute('aria-expanded')) === 'true';

    if (!isExpanded) {
      await accordionControl.click();
    }
  }

  async addCarRental(carRentalData: {
    rentalCompany: string;
    pickupLocation: string;
    dropOffLocation: string;
    pickupTime: Date;
    dropOffTime: Date;
    confirmationCode: string;
    cost: number;
    currencyCode: string;
  }) {
    await this.openAccordionSection('Transportation');
    await this.page.getByTestId('add-transportation-button').click();
    await this.page.getByRole('menuitem', { name: 'Car Rental' }).click();
    await this.page.getByLabel('Rental Company').fill(carRentalData.rentalCompany);
    await this.page.getByLabel('Pickup Location').fill(carRentalData.pickupLocation);

    const startDateSelector = getSelectorString(carRentalData.pickupTime);
    const endDateSelector = getSelectorString(carRentalData.dropOffTime);

    await this.page.click('[data-testid="pickup-time"]');
    await this.page.click(startDateSelector);
    await this.page.click(`button[aria-label="Submit Date"]`);

    await this.page.getByLabel('Drop Off Location').fill(carRentalData.dropOffLocation);
    await this.page.getByLabel('Confirmation Code').fill(carRentalData.confirmationCode);
    await this.page.getByLabel('Cost').fill(carRentalData.cost.toString());

    await this.page.click('[data-testid="drop-off-time"]');
    await this.page.click(endDateSelector);
    await this.page.click(`button[aria-label="Submit Date"]`);

    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Add a transportation to the trip
   */
  async addTransportation(transportationData: {
    type: 'Flight' | 'Train' | 'Bus' | 'Car' | 'Ferry' | 'Other';
    startDate: Date;
    endDate: Date;
    startLocation: string;
    endLocation: string;
    confirmationCode?: string;
    provider?: string;
    attachment?: string;
  }) {
    // Open the transportation section
    await this.openAccordionSection('Transportation');

    // Click the Add Transportation button
    await this.page.getByTestId('add-transportation-button').click();

    // Select the transportation type
    await this.page.getByRole('menuitem', { name: transportationData.type }).click();

    if (transportationData.type === 'Flight') {
      await this.page.getByLabel('From').fill(transportationData.startLocation);
      await this.page.getByRole('option', { name: transportationData.startLocation }).click();

      await this.page.getByLabel('To').fill(transportationData.endLocation);
      await this.page.getByRole('option', { name: transportationData.endLocation }).click();
    } else {
      await this.page.getByLabel('From').fill(transportationData.startLocation);
      await this.page.getByLabel('To').fill(transportationData.endLocation);
    }

    // Fill in the dates
    const startDateSelector = getSelectorString(transportationData.startDate);
    const endDateSelector = getSelectorString(transportationData.endDate);

    await this.page.click('[data-testid="departure-time"]');
    await this.page.click(startDateSelector);
    await this.page.click(`button[aria-label="Submit Date"]`);

    await this.page.waitForTimeout(100);

    await this.page.click('[data-testid="arrival-time"]');
    await this.page.click(endDateSelector);
    await this.page.click(`button[aria-label="Submit Date"]`);

    if (transportationData.provider) {
      const providerLabel = transportationData.type === 'Flight' ? 'Airline' : 'Provider';
      await this.page.getByLabel(providerLabel).fill(transportationData.provider);
      if (providerLabel === 'Airline') {
        await this.page.getByText('Create New').click();
      }
    }

    if (transportationData.confirmationCode) {
      const providerLabel = transportationData.type === 'Flight' ? 'Confirmation Code' : 'Reservation';
      await this.page.getByLabel(providerLabel).fill(transportationData.confirmationCode);
    }

    if (transportationData.attachment) {
      const fileChooserPromise = this.page.waitForEvent('filechooser');
      await this.page.getByRole('button', { name: 'Upload' }).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(transportationData.attachment);
    }

    // Save the transportation
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Add a lodging to the trip
   */
  async addLodging(lodgingData: {
    type: string;
    name: string;
    startDate: Date;
    endDate: Date;
    address: string;
    confirmationCode?: string;
  }) {
    // Open the lodging section
    await this.openAccordionSection('Lodging');

    // Click the Add Lodging button
    await this.page.getByTestId('add-lodging-button').click();
    await this.page.getByRole('menuitem', { name: lodgingData.type }).click();

    // Fill in the name
    await this.page.getByLabel('Name').fill(lodgingData.name);

    // Fill in the location
    await this.page.getByLabel('Address').fill(lodgingData.address);

    if (lodgingData.confirmationCode) {
      await this.page.getByLabel('Confirmation Code').fill(lodgingData.confirmationCode);
    }

    // Fill in the dates
    const startDateSelector = getSelectorString(lodgingData.startDate);
    const endDateSelector = getSelectorString(lodgingData.endDate);

    await this.page.click('[data-testid="lodging-start-date"]');
    await this.page.click(startDateSelector);
    await this.page.click(`button[aria-label="Submit Date"]`);

    await this.page.waitForTimeout(100);

    await this.page.click('[data-testid="lodging-end-date"]');
    await this.page.click(endDateSelector);
    await this.page.click(`button[aria-label="Submit Date"]`);

    // Save the lodging
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /**
   * Add an activity to the trip
   */
  async addActivity(activityData: { name: string; startDate: Date; address: string; description?: string }) {
    // Open the activities section
    await this.openAccordionSection('Activities');

    // Click the Add Activity button
    await this.page.getByRole('button', { name: 'Add Activity' }).click();

    // Fill in the name
    await this.page.getByLabel('Name').fill(activityData.name);

    // Fill in the dates
    const startDateStr = dayjs(activityData.startDate).format('D MMMM YYYY');
    await this.page.click('[data-testid="activity-start-date"]');
    await this.page.click(`button[aria-label="${startDateStr}"]`);

    // Fill in the location
    await this.page.getByLabel('Address').fill(activityData.address);

    // Fill in notes if provided
    if (activityData.description) {
      await this.page.getByLabel('Description').fill(activityData.description);
    }

    // Save the activity
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /**
   * Add a note to the trip
   */
  async addNote(noteText: string) {
    // Switch to the Notes tab
    await this.switchToTab('Notes');

    // Click the Add Note button
    await this.page.getByLabel('Add Notes').click();

    // Fill in the note text
    await this.page.locator('[class="tiptap ProseMirror"]').fill(noteText);

    // Save the note
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /**
   * Check that an attachment is visible in the Attachments tab
   */
  async checkAttachmentVisible(attachmentName: string) {
    // Switch to the Attachments tab
    await this.switchToTab('Attachments');

    // Check that the attachment is visible
    await expect(this.page.getByRole('link', { name: attachmentName })).toBeVisible();
  }
}
