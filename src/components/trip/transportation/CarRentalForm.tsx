import { Button, FileButton, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Attachment, CarRentalFormSchema, CreateTransportation, Transportation, Trip } from '../../../types/trips.ts';
import { useForm, UseFormReturnType } from '@mantine/form';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createTransportationEntry, uploadAttachments } from '../../../lib/api';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { updateTransportation } from '../../../lib/api/pocketbase/transportations.ts';
import { showErrorNotification } from '../../../lib/notifications.tsx';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';
import dayjs from 'dayjs';

export const CarRentalForm = ({
  trip,
  carRental,
  onSuccess,
  onCancel,
  exitingAttachments,
}: {
  trip: Trip;
  carRental?: Transportation;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);

  const form = useForm<CarRentalFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      rentalCompany: carRental?.metadata?.rentalCompany,
      pickupLocation: carRental?.origin,
      dropOffLocation: carRental?.destination,
      pickupTime: carRental?.departureTime,
      dropOffTime: carRental?.arrivalTime,
      confirmationCode: carRental?.metadata?.confirmationCode,
      cost: carRental?.cost?.value,
      currencyCode: carRental?.cost?.currency || user?.currencyCode || 'USD',
      place: carRental?.metadata?.place,
    },
    validate: {},
  });

  // @ts-expect-error it ok
  const handleFormSubmit = (values) => {
    setSaving(true);
    const carRentalData: CreateTransportation = {
      type: 'rental_car',
      trip: trip.id,
      origin: values.pickupLocation,
      destination: values.dropOffLocation,
      cost: {
        value: values.cost,
        currency: values.currencyCode,
      },
      departureTime: fakeAsUtcString(values.pickupTime),
      arrivalTime: fakeAsUtcString(values.dropOffTime),
      metadata: {
        confirmationCode: values.confirmationCode,
        rentalCompany: values.rentalCompany,
        place: values.place,
      },
    };

    uploadAttachments(trip.id, files).then((attachments: Attachment[]) => {
      if (carRental?.id) {
        carRentalData.attachmentReferences = [
          ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
          ...attachments.map((attachment: Attachment) => attachment.id),
        ];
        updateTransportation(carRental.id, carRentalData).then(() => {
          onSuccess();
        });
      } else {
        carRentalData.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
        createTransportationEntry(carRentalData)
          .then(() => {
            onSuccess();
          })
          .catch((error) => {
            console.log('error => ', JSON.stringify(error));
            showErrorNotification({
              error,
              title: t('car_rental_creation_failed', 'Unable to create Car Rental Entry'),
              message: 'Please try again later.',
            });
          });
      }
      setSaving(false);
    });
  };

  return (
    <Stack>
      <Title order={4}>{t('transportation_add_rental_car', 'Add Rental Car')}</Title>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Group>
            <PlaceSelect
              form={form as UseFormReturnType<unknown>}
              propName={'place'}
              presetDestinations={trip.destinations || []}
              label={t('associated_destination', 'Destination')}
              description={t('associated_destination_desc', 'Associated Destination')}
              key={form.key('place')}
              {...form.getInputProps('place')}
            />

            <TextInput
              name={'rentalCompany'}
              label={t('transportation_rental_company', 'Rental Company')}
              description={t('transportation_rental_company_desc', 'Name of the Rental Company')}
              required
              key={form.key('rentalCompany')}
              {...form.getInputProps('rentalCompany')}
            />
          </Group>
          <Group grow>
            <DateTimePicker
              highlightToday
              valueFormat="DD MMM YYYY hh:mm A"
              name={'pickupTime'}
              label={t('transportation_pickup_time', 'Pickup Time')}
              description={t('transportation_pickup_time_desc', 'Date and time for pickup')}
              clearable
              required
              key={form.key('pickupTime')}
              {...form.getInputProps('pickupTime')}
              date={trip.startDate}
              minDate={trip.startDate}
              maxDate={dayjs(trip.endDate).endOf('day').toDate()}
              data-testid={'pickup-time'}
              submitButtonProps={{
                'aria-label': 'Submit Date',
              }}
            />

            <DateTimePicker
              highlightToday
              valueFormat="DD MMM YYYY hh:mm A"
              name={'dropOffTime'}
              label={t('transportation_dropOff_time', 'Drop Off Time')}
              description={t('transportation_dropoff_time_desc', 'Date and time for drop-off')}
              clearable
              required
              key={form.key('dropOffTime')}
              {...form.getInputProps('dropOffTime')}
              date={trip.startDate}
              minDate={trip.startDate}
              maxDate={dayjs(trip.endDate).endOf('day').toDate()}
              data-testid={'drop-off-time'}
              submitButtonProps={{
                'aria-label': 'Submit Date',
              }}
            />
          </Group>
          <Group>
            <TextInput
              name={'pickupLocation'}
              label={t('transportation_pickup_location', 'Pickup Location')}
              description={t('transportation_pickup_location_desc', 'Address of the pickup location')}
              required
              key={form.key('pickupLocation')}
              {...form.getInputProps('pickupLocation')}
            />
            <TextInput
              name={'dropOffLocation'}
              label={t('transportation_dropOff_location', 'Drop Off Location')}
              description={t('transportation_dropOff_location_desc', 'Address of the drop-off location')}
              required
              key={form.key('dropOffLocation')}
              {...form.getInputProps('dropOffLocation')}
            />
          </Group>
          <Group>
            <TextInput
              name={'confirmationCode'}
              label={t('transportation_confirmation_code', 'Confirmation Code')}
              description={t('transportation_confirmation_code_desc', 'Reservation Id, Booking code etc')}
              key={form.key('confirmationCode')}
              {...form.getInputProps('confirmationCode')}
            />
            <CurrencyInput
              costKey={form.key('cost')}
              costProps={form.getInputProps('cost')}
              currencyCodeKey={form.key('currencyCode')}
              currencyCodeProps={form.getInputProps('currencyCode')}
              label={t('car_rental_cost', 'Cost')}
              description={t('car_rental_cost_desc', 'Charges for this rental')}
            />
          </Group>
          <Group>
            <Stack>
              <Group>
                <Title size={'md'}>
                  {t('attachments', 'Attachments')}
                  <Text size={'xs'} c={'dimmed'}>
                    {t(
                      'transportation_rental_attachments_desc',
                      'Upload any related documents for this rental e.g. confirmation email'
                    )}
                  </Text>
                </Title>
              </Group>
              <Group>
                {files.map((file, index) => (
                  <Text key={index}>{file.name}</Text>
                ))}
              </Group>

              <Group>
                <FileButton
                  onChange={setFiles}
                  accept="application/pdf,text/plain,text/html,image/png,image/jpeg,image/gif,image/webp"
                  form={'files'}
                  name={'files'}
                  multiple
                >
                  {(props) => {
                    if (carRental?.id) {
                      return (
                        <Stack>
                          <Text
                            size={'xs'}
                          >{`${exitingAttachments ? exitingAttachments.length : 0} existing files`}</Text>
                          <Button {...props}>{t('upload_more', 'Upload More')}</Button>
                        </Stack>
                      );
                    } else {
                      return <Button {...props}>{t('upload', 'Upload')}</Button>;
                    }
                  }}
                </FileButton>
              </Group>
            </Stack>
          </Group>
          <Group justify={'flex-end'}>
            <Button type={'submit'} w={'min-content'} loading={saving}>
              {t('save', 'Save')}
            </Button>
            <Button
              type={'button'}
              variant={'default'}
              w={'min-content'}
              onClick={() => {
                onCancel();
              }}
            >
              {t('cancel', 'Cancel')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
};
