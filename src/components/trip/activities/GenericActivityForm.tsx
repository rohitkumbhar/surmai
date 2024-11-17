import { Activity, ActivityFormSchema, CreateActivity, Trip } from '../../../types/trips.ts';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { Button, FileButton, Group, rem, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { createActivityEntry, saveActivityAttachments, updateActivityEntry } from '../../../lib';

export const GenericActivityForm = ({
  trip,
  activity,
  onSuccess,
  onCancel,
}: {
  trip: Trip;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const form = useForm<ActivityFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      name: activity?.name,
      description: activity?.description,
      address: activity?.address,
      cost: activity?.cost?.value,
      currencyCode: activity?.cost?.currency || user?.currencyCode || 'USD',
      startDate: activity?.startDate,
    },
  });

  const handleFormSubmit = (values: ActivityFormSchema) => {
    const data = {
      name: values.name,
      description: values.description,
      address: values.address,
      startDate: values.startDate,
      trip: trip.id,
      cost: {
        value: values.cost,
        currency: values.currencyCode,
      },
    };

    if (activity?.id) {
      // update
      updateActivityEntry(activity.id, data as CreateActivity).then((result) => {
        if (files.length > 0) {
          saveActivityAttachments(result.id, files).then(() => {
            onSuccess();
          });
        } else {
          onSuccess();
        }
      });
    } else {
      createActivityEntry(data as CreateActivity).then((result) => {
        if (files.length > 0) {
          saveActivityAttachments(result.id, files).then(() => {
            onSuccess();
          });
        } else {
          onSuccess();
        }
      });
    }

    onSuccess();
  };

  return (
    <Stack>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Stack>
            <TextInput
              name={'name'}
              label={t('activity.name', 'Name')}
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <Textarea
              name={'address'}
              label={t('activity.description', 'Description')}
              key={form.key('description')}
              {...form.getInputProps('description')}
            />
            <Textarea
              name={'address'}
              label={t('activity.address', 'Address')}
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
              label={t('activity.start_date', 'Date/Time')}
              clearable
              required
              key={form.key('startDate')}
              {...form.getInputProps('startDate')}
              miw={rem(200)}
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
                    if (activity?.id) {
                      return (
                        <Stack>
                          <Text
                            size={'xs'}
                          >{`${activity.attachments ? activity.attachments.length : 0} existing files`}</Text>
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
            <Button type={'submit'} w={'min-content'}>
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
