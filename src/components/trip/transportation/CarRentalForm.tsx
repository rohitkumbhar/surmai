import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Attachment, CarRentalFormSchema, CreateTransportation, Transportation, Trip } from '../../../types/trips.ts';
import { useForm } from '@mantine/form';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createTransportationEntry, uploadAttachments } from '../../../lib/api';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { updateTransportation } from '../../../lib/api/pocketbase/transportations.ts';
import { showErrorNotification } from '../../../lib/notifications.tsx';

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
            <TextInput
              name={'rentalCompany'}
              label={t('transportation_rental_company', 'Rental Company')}
              required
              key={form.key('rentalCompany')}
              {...form.getInputProps('rentalCompany')}
            />

            <DateTimePicker
              highlightToday
              valueFormat="DD MMM YYYY hh:mm A"
              name={'pickupTime'}
              label={t('transportation_pickup_time', 'Pickup Time')}
              clearable
              required
              key={form.key('pickupTime')}
              {...form.getInputProps('pickupTime')}
              miw={rem(150)}
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
              clearable
              required
              key={form.key('dropOffTime')}
              {...form.getInputProps('dropOffTime')}
              miw={rem(150)}
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
              required
              miw={rem('300px')}
              key={form.key('pickupLocation')}
              {...form.getInputProps('pickupLocation')}
            />
            <TextInput
              name={'dropOffLocation'}
              label={t('transportation_dropOff_location', 'Drop Off Location')}
              required
              miw={rem('300px')}
              key={form.key('dropOffLocation')}
              {...form.getInputProps('dropOffLocation')}
            />
            <TextInput
              name={'confirmationCode'}
              label={t('transportation_confirmation_code', 'Confirmation Code')}
              key={form.key('confirmationCode')}
              {...form.getInputProps('confirmationCode')}
            />
          </Group>
          <Group>
            <Stack>
              <CurrencyInput
                costKey={form.key('cost')}
                costProps={form.getInputProps('cost')}
                currencyCodeKey={form.key('currencyCode')}
                currencyCodeProps={form.getInputProps('currencyCode')}
              />
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
