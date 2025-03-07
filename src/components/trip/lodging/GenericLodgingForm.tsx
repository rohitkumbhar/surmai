import { CreateLodging, Lodging, LodgingFormSchema, Trip } from '../../../types/trips.ts';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { Button, FileButton, Group, rem, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useTranslation } from 'react-i18next';
import { createLodgingEntry, saveLodgingAttachments, updateLodgingEntry } from '../../../lib/api';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';

import { fakeAsUtcString } from '../../../lib/time.ts';
import dayjs from 'dayjs';

export const GenericLodgingForm = ({
  trip,
  type,
  lodging,
  onSuccess,
  onCancel,
}: {
  trip: Trip;
  lodging?: Lodging;
  type: string;
  onSuccess: () => void;
  onCancel: () => void;
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
    };

    if (lodging?.id) {
      // update
      updateLodgingEntry(lodging.id, data as unknown as CreateLodging).then((result) => {
        if (files.length > 0) {
          saveLodgingAttachments(result.id, files).then(() => {
            onSuccess();
          });
        } else {
          onSuccess();
        }
      });
    } else {
      createLodgingEntry(data as unknown as CreateLodging).then((result) => {
        if (files.length > 0) {
          saveLodgingAttachments(result.id, files).then(() => {
            onSuccess();
          });
        } else {
          onSuccess();
        }
      });
    }

    setSaving(false);
    onSuccess();
  };

  return (
    <Stack>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Stack>
            <TextInput
              name={'name'}
              label={t('lodging.name', 'Name')}
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />

            <Textarea
              name={'address'}
              label={t('lodging.address', 'Address')}
              required
              key={form.key('address')}
              {...form.getInputProps('address')}
            />
          </Stack>
          <Group>
            <DateTimePicker
              highlightToday
              valueFormat="lll"
              name={'startDate'}
              label={t('lodging.start_date', 'Check-In')}
              clearable
              required
              minDate={trip.startDate}
              maxDate={trip.endDate}
              key={form.key('startDate')}
              {...form.getInputProps('startDate')}
              miw={rem(200)}
            />

            <DateTimePicker
              valueFormat="lll"
              name={'endDate'}
              label={t('lodging.end_date', 'Check-Out')}
              required
              miw={rem('200px')}
              clearable
              minDate={trip.startDate}
              maxDate={dayjs(trip.endDate).endOf('day').toDate()}
              key={form.key('endDate')}
              {...form.getInputProps('endDate')}
            />
          </Group>
          <Group>
            <TextInput
              name={'confirmationCode'}
              label={t('lodging.confirmationCode', 'ConfirmationCode')}
              key={form.key('confirmationCode')}
              {...form.getInputProps('confirmationCode')}
            />

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
                    {t('lodging.attachments_desc', 'Upload any related documents e.g. confirmation email')}
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
                          >{`${lodging.attachments ? lodging.attachments.length : 0} existing files`}</Text>
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
