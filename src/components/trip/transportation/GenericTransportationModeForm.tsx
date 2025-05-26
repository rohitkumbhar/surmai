import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  Attachment,
  CreateTransportation,
  Transportation,
  TransportationFormSchema,
  Trip,
} from '../../../types/trips.ts';
import { useForm } from '@mantine/form';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { createTransportationEntry, uploadAttachments } from '../../../lib/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { transportationConfig } from './config.tsx';
import dayjs from 'dayjs';
import { updateTransportation } from '../../../lib/api/pocketbase/transportations.ts';

export const GenericTransportationModeForm = ({
  transportationType,
  trip,
  transportation,
  onSuccess,
  onCancel,
  exitingAttachments,
}: {
  transportationType: string;
  trip: Trip;
  transportation?: Transportation;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);

  const config =
    transportationType in transportationConfig
      ? transportationConfig[transportationType]
      : transportationConfig['default'];

  const form = useForm<TransportationFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      origin: transportation?.origin,
      departureTime: transportation?.departureTime,
      destination: transportation?.destination,
      arrivalTime: transportation?.arrivalTime,
      provider: transportation?.metadata?.provider,
      reservation: transportation?.metadata?.reservation,
      cost: transportation?.cost?.value,
      currencyCode: transportation?.cost?.currency || user?.currencyCode || 'USD',
    },
    validate: {},
  });

  // @ts-expect-error it ok
  const handleFormSubmit = (values) => {
    setSaving(true);
    const payload: CreateTransportation = config.buildPayload(trip, transportationType, values);

    // {
    //   type: transportationType,
    //   origin: transportationType === 'flight' ? values.origin.iataCode : values.origin,
    //   destination: transportationType === 'flight' ? values.destination.iataCode : values.destination,
    //   cost: {
    //     value: values.cost,
    //     currency: values.currencyCode,
    //   },
    //   departureTime: fakeAsUtcString(values.departureTime),
    //   arrivalTime: fakeAsUtcString(values.arrivalTime),
    //   trip: trip.id,
    //   metadata: {
    //     provider: values.provider,
    //     reservation: values.reservation,
    //     origin: transportationType === 'flight' ? values.origin : undefined,
    //     destination: transportationType === 'flight' ? values.destination : undefined,
    //   },
    // };
    console.log('saving files => ', JSON.stringify(files));

    uploadAttachments(trip.id, files)
      .then((attachments: Attachment[]) => {
        if (transportation?.id) {
          payload.attachmentReferences = [
            ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
            ...attachments.map((attachment: Attachment) => attachment.id),
          ];
          updateTransportation(transportation.id, payload).then(() => {
            onSuccess();
          });
        } else {
          payload.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
          createTransportationEntry(payload)
            .then(() => {
              onSuccess();
            })
            .catch((error) => {
              console.log('error => ', error);
            });
        }
        setSaving(false);
      })
      .catch((error) => {
        console.log('error => ', error);
      });
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
      <Stack>
        <Group>
          {config.components.from(form)}

          <DateTimePicker
            highlightToday
            valueFormat="lll"
            name={'departureTime'}
            miw={rem('200px')}
            label={t('transportation_departure_time', 'Departure')}
            clearable
            required
            minDate={trip.startDate}
            maxDate={trip.endDate}
            key={form.key('departureTime')}
            {...form.getInputProps('departureTime')}
            data-testid={'departure-time'}
            submitButtonProps={{
              'aria-label': 'Submit Date',
            }}
          />
        </Group>
        <Group>
          {config.components.to(form)}
          <DateTimePicker
            valueFormat="lll"
            name={'arrivalTime'}
            label={t('transportation_arrival_time', 'Arrival')}
            required
            miw={rem('200px')}
            minDate={trip.startDate}
            maxDate={dayjs(trip.endDate).endOf('day').toDate()}
            clearable
            key={form.key('arrivalTime')}
            {...form.getInputProps('arrivalTime')}
            data-testid={'arrival-time'}
            submitButtonProps={{
              'aria-label': 'Submit Date',
            }}
          />
        </Group>
        <Group>
          {config.components.provider(form)}
          <TextInput
            name={'reservation'}
            label={config.strings.reservationLabel}
            key={form.key('reservation')}
            {...form.getInputProps('reservation')}
          />
        </Group>
        <Group>
          <CurrencyInput
            costKey={form.key('cost')}
            costProps={form.getInputProps('cost')}
            currencyCodeKey={form.key('currencyCode')}
            currencyCodeProps={form.getInputProps('currencyCode')}
          />
        </Group>
        <Group>
          <Stack>
            <Group>
              <Title size={'md'}>
                {t('attachments', 'Attachments')}
                <Text size={'xs'} c={'dimmed'}>
                  {t('transportation_attachments_desc', 'Upload any related documents e.g. confirmation email')}
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
                accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
                form={'files'}
                name={'files'}
                multiple
              >
                {(props) => {
                  if (transportation?.id) {
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
  );
};
