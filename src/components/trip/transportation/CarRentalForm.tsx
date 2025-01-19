import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { CarRentalFormSchema, CreateTransportation, Transportation, Trip } from '../../../types/trips.ts';
import { useForm } from '@mantine/form';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createTransportationEntry, saveTransportationAttachments } from '../../../lib/api';
import { updateTransportation } from '../../../lib/api/pocketbase/trips.ts';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';

export const CarRentalForm = ({
  trip,
  carRental,
  onSuccess,
  onCancel,
}: {
  trip: Trip;
  carRental?: Transportation;
  onSuccess: () => void;
  onCancel: () => void;
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
      departureTime: values.pickupTime,
      arrivalTime: values.dropOffTime,
      metadata: {
        confirmationCode: values.confirmationCode,
        rentalCompany: values.rentalCompany,
      },
    };

    if (carRental?.id) {
      updateTransportation(carRental.id, carRentalData).then((result) => {
        if (files.length > 0) {
          saveTransportationAttachments(result.id, files).then(() => {
            onSuccess();
          });
        } else {
          onSuccess();
        }
      });
    } else {
      createTransportationEntry(carRentalData).then((transportation) => {
        if (files.length > 0) {
          saveTransportationAttachments(transportation.id, files).then(() => {
            onSuccess();
          });
        } else {
          onSuccess();
        }
      });
    }

    setSaving(false);
  };

  return (
    <Stack>
      <Title order={4}>{t('transportation.add_rental_car', 'Add Rental Car')}</Title>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Group>
            <TextInput
              name={'rentalCompany'}
              label={t('transportation.rental_company', 'Rental Company')}
              required
              key={form.key('rentalCompany')}
              {...form.getInputProps('rentalCompany')}
            />

            <DateTimePicker
              highlightToday
              valueFormat="DD MMM YYYY hh:mm A"
              name={'pickupTime'}
              label={t('transportation.pickup_time', 'Pickup Time')}
              clearable
              required
              key={form.key('pickupTime')}
              {...form.getInputProps('pickupTime')}
              miw={rem(150)}
            />

            <DateTimePicker
              highlightToday
              valueFormat="DD MMM YYYY hh:mm A"
              name={'dropOffTime'}
              label={t('transportation.dropOff_time', 'Drop-off Time')}
              clearable
              required
              key={form.key('dropOffTime')}
              {...form.getInputProps('dropOffTime')}
              miw={rem(150)}
            />
          </Group>
          <Group>
            <TextInput
              name={'pickupLocation'}
              label={t('transportation.pickup_location', 'Pickup Location')}
              required
              miw={rem('300px')}
              key={form.key('pickupLocation')}
              {...form.getInputProps('pickupLocation')}
            />
            <TextInput
              name={'dropOffLocation'}
              label={t('transportation.dropOff_location', 'DropOff Location')}
              required
              miw={rem('300px')}
              key={form.key('dropOffLocation')}
              {...form.getInputProps('dropOffLocation')}
            />
            <TextInput
              name={'confirmationCode'}
              label={t('transportation.confirmation_code', 'Confirmation Code')}
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
                      'transportation.attachments_desc',
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
                          >{`${carRental.attachments ? carRental.attachments.length : 0} existing files`}</Text>
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
