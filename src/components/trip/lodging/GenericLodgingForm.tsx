import { Attachment, CreateLodging, Lodging, LodgingFormSchema, Trip } from '../../../types/trips.ts';
import { useForm, UseFormReturnType } from '@mantine/form';
import { useState } from 'react';
import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useTranslation } from 'react-i18next';
import { createLodgingEntry, updateLodgingEntry, uploadAttachments } from '../../../lib/api';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';

import { fakeAsUtcString } from '../../../lib/time.ts';
import dayjs from 'dayjs';
import i18n from '../../../lib/i18n.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';

export const GenericLodgingForm = ({
  trip,
  type,
  lodging,
  onSuccess,
  onCancel,
  exitingAttachments,
}: {
  trip: Trip;
  lodging?: Lodging;
  type: string;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[] | undefined;
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);
  const form = useForm<LodgingFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      type: type,
      name: lodging?.name,
      address: lodging?.address,
      cost: lodging?.cost?.value,
      currencyCode: lodging?.cost?.currency || user?.currencyCode || 'USD',
      startDate: lodging?.startDate,
      endDate: lodging?.endDate,
      confirmationCode: lodging?.confirmationCode,
      place: lodging?.metadata?.place?.name || '',
    },
  });

  const handleFormSubmit = (values: LodgingFormSchema) => {
    setSaving(true);
    const data = {
      type: type,
      name: values.name,
      address: values.address,
      startDate: fakeAsUtcString(values.startDate),
      endDate: fakeAsUtcString(values.endDate),
      confirmationCode: values.confirmationCode,
      trip: trip.id,
      cost: {
        value: values.cost,
        currency: values.currencyCode,
      },
      attachmentReferences: lodging?.attachmentReferences || [],
      metadata: {
        place: values.place,
      },
    };

    uploadAttachments(trip.id, files).then((attachments: Attachment[]) => {
      if (lodging?.id) {
        data.attachmentReferences = [
          ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
          ...attachments.map((attachment: Attachment) => attachment.id),
        ];
        updateLodgingEntry(lodging.id, data as unknown as CreateLodging).then(() => {
          onSuccess();
        });
      } else {
        data.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
        createLodgingEntry(data as unknown as CreateLodging).then(() => {
          onSuccess();
        });
      }
      setSaving(false);
    });
  };

  return (
    <Stack>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Stack>
            <TextInput
              name={'name'}
              label={t('lodging_name', 'Name')}
              description={t('lodging_name_desc', 'Name of the hotel, residence etc')}
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />

            <Group>
              <PlaceSelect
                form={form as UseFormReturnType<unknown>}
                propName={'place'}
                presetDestinations={trip.destinations || []}
                label={i18n.t('lodging_place', 'Destination')}
                description={i18n.t('lodging_place_desc', 'Associated destination')}
                key={form.key('place')}
                {...form.getInputProps('place')}
              />

              <TextInput
                name={'address'}
                label={t('lodging_address', 'Address')}
                description={t('lodging_address_desc', 'Address of the hotel, residence etc')}
                required
                key={form.key('address')}
                {...form.getInputProps('address')}
              />
            </Group>
          </Stack>
          <Group>
            <DateTimePicker
              valueFormat="lll"
              name={'startDate'}
              label={t('lodging_start_date', 'Check-In')}
              description={t('lodging_start_date_desc', 'Check-In date & time')}
              clearable
              required
              defaultDate={trip.startDate}
              minDate={trip.startDate}
              maxDate={trip.endDate}
              key={form.key('startDate')}
              {...form.getInputProps('startDate')}
              miw={rem(200)}
              data-testid={'lodging-start-date'}
              submitButtonProps={{
                'aria-label': 'Submit Date',
              }}
            />

            <DateTimePicker
              valueFormat="lll"
              name={'endDate'}
              label={t('lodging_end_date', 'Check-Out')}
              description={t('lodging_end_date_desc', 'Check-Out date & time')}
              required
              miw={rem('200px')}
              clearable
              defaultDate={trip.startDate}
              minDate={trip.startDate}
              maxDate={dayjs(trip.endDate).endOf('day').toDate()}
              key={form.key('endDate')}
              {...form.getInputProps('endDate')}
              data-testid={'lodging-end-date'}
              submitButtonProps={{
                'aria-label': 'Submit Date',
              }}
            />
          </Group>
          <Group>
            <TextInput
              name={'confirmationCode'}
              label={t('lodging_confirmation_code', 'Confirmation Code')}
              description={t('lodging_confirmation_code_desc', 'Booking Id, Reservation code etc')}
              key={form.key('confirmationCode')}
              {...form.getInputProps('confirmationCode')}
            />

            <CurrencyInput
              costKey={form.key('cost')}
              costProps={form.getInputProps('cost')}
              currencyCodeKey={form.key('currencyCode')}
              currencyCodeProps={form.getInputProps('currencyCode')}
              label={t('lodging_cost', 'Cost')}
              description={t('lodging_cost_desc', 'Charges for this accommodation')}
            />
          </Group>
          <Group>
            <Stack>
              <Group>
                <Title size={'md'}>
                  {t('attachments', 'Attachments')}
                  <Text size={'xs'} c={'dimmed'}>
                    {t('lodging_attachments_desc', 'Upload any related documents e.g. confirmation email')}
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
                    if (lodging?.id) {
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
