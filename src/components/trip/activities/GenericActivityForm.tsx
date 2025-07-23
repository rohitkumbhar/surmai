import { Activity, ActivityFormSchema, Attachment, CreateActivity, Trip } from '../../../types/trips.ts';
import { useForm, UseFormReturnType } from '@mantine/form';
import { useState } from 'react';
import { Button, FileButton, Group, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { createActivityEntry, updateActivityEntry, uploadAttachments } from '../../../lib/api';

import { fakeAsUtcString } from '../../../lib/time.ts';
import i18n from '../../../lib/i18n.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';

export const GenericActivityForm = ({
  trip,
  activity,
  onSuccess,
  onCancel,
  exitingAttachments,
}: {
  trip: Trip;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);
  const form = useForm<ActivityFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      name: activity?.name,
      description: activity?.description,
      address: activity?.address,
      cost: activity?.cost?.value,
      currencyCode: activity?.cost?.currency || user?.currencyCode || 'USD',
      startDate: activity?.startDate,
      endDate: activity?.endDate,
      place: activity?.metadata?.place,
    },
  });

  const handleFormSubmit = (values: ActivityFormSchema) => {
    setSaving(true);
    const data = {
      name: values.name,
      description: values.description,
      address: values.address,
      startDate: fakeAsUtcString(values.startDate),
      endDate: fakeAsUtcString(values.endDate),
      trip: trip.id,
      cost: {
        value: values.cost,
        currency: values.currencyCode,
      },
      attachmentReferences: activity?.attachmentReferences || [],
      metadata: {
        place: values.place,
      },
    };

    uploadAttachments(trip.id, files).then((attachments: Attachment[]) => {
      if (activity?.id) {
        data.attachmentReferences = [
          ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
          ...attachments.map((attachment: Attachment) => attachment.id),
        ];
        updateActivityEntry(activity.id, data as unknown as CreateActivity).then(() => {
          onSuccess();
        });
      } else {
        data.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
        createActivityEntry(data as unknown as CreateActivity).then(() => {
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
              label={t('activity_name', 'Name')}
              description={t('activity_name_desc', 'Name of the activity e.g. Hike to Diamond Head')}
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <Textarea
              name={'address'}
              label={t('activity_description', 'Description')}
              description={t('activity_desc_desc', 'More description if required')}
              key={form.key('description')}
              {...form.getInputProps('description')}
            />

            <Group>
              <PlaceSelect
                form={form as UseFormReturnType<unknown>}
                propName={'place'}
                presetDestinations={trip.destinations || []}
                label={i18n.t('activity_place', 'Destination')}
                description={i18n.t('activity_place_desc', 'Associated destination')}
                key={form.key('place')}
                {...form.getInputProps('place')}
              />
              <TextInput
                name={'address'}
                label={t('activity_address', 'Address')}
                description={t('activity_address_desc', 'Location of the activity')}
                required
                key={form.key('address')}
                {...form.getInputProps('address')}
              />
            </Group>
          </Stack>
          <Group grow={true}>
            <DateTimePicker
              highlightToday
              valueFormat="lll"
              name={'startDate'}
              label={t('activity_start_date', 'Start Date')}
              description={t('activity_start_date_desc', 'Activity start date and time')}
              clearable
              required
              defaultDate={trip.startDate}
              minDate={trip.startDate}
              maxDate={trip.endDate}
              key={form.key('startDate')}
              {...form.getInputProps('startDate')}
              data-testid={'activity-start-date'}
              submitButtonProps={{
                'aria-label': 'Submit Date',
              }}
            />

            <DateTimePicker
              highlightToday
              valueFormat="lll"
              name={'endDate'}
              label={t('activity_end_date', 'End Date')}
              description={t('activity_end_date_desc', 'Activity end date and time')}
              clearable
              required
              minDate={trip.startDate}
              maxDate={trip.endDate}
              key={form.key('endDate')}
              {...form.getInputProps('endDate')}
              data-testid={'activity-end-date'}
              submitButtonProps={{
                'aria-label': 'Submit Date',
              }}
            />
          </Group>
          <Group>
            <CurrencyInput
              costKey={form.key('cost')}
              costProps={form.getInputProps('cost')}
              currencyCodeKey={form.key('currencyCode')}
              currencyCodeProps={form.getInputProps('currencyCode')}
              label={t('activity_cost', 'Cost')}
              description={t('activity_cost_desc', 'Charges for this activity')}
            />
          </Group>
          <Group>
            <Stack>
              <Group>
                <Title size={'md'}>
                  {t('attachments', 'Attachments')}
                  <Text size={'xs'} c={'dimmed'}>
                    {t('activity_attachments_desc', 'Upload any related documents e.g. confirmation email')}
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
                  accept="application/pdf,image/png,image/jpeg,image/gif,image/webp,text/html"
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
            <Button type={'submit'} loading={saving} w={'min-content'}>
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
