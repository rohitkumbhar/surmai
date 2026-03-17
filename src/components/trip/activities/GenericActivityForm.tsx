import { Button, Grid, Group, Textarea, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { saveActivity } from '../../../lib/api';
import i18n from '../../../lib/i18n.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { AttachmentsUploadField } from '../attachments/AttachmentsUploadField.tsx';
import { TravellerMultiSelect } from '../TravellerMultiSelect.tsx';

import type { SaveEntityPayload } from '../../../lib/api';
import type { Activity, ActivityFormSchema, Attachment, Expense, TravellerProfile, Trip } from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const GenericActivityForm = ({
  trip,
  activity,
  onSuccess,
  onCancel,
  exitingAttachments,
  expenseMap,
  tripTravellers = [],
}: {
  trip: Trip;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
  expenseMap?: Map<string, Expense>;
  tripTravellers?: TravellerProfile[];
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);

  // Get expense from map if activity has an expenseId
  const expense = activity?.expenseId && expenseMap ? expenseMap.get(activity.expenseId) : undefined;

  const form = useForm<ActivityFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      name: activity?.name,
      description: activity?.description,
      address: activity?.address,
      cost: expense?.cost?.value,
      currencyCode: expense?.cost?.currency || user?.currencyCode || 'USD',
      startDate: activity?.startDate,
      endDate: activity?.endDate,
      link: activity?.link,
      place: activity?.metadata?.place,
      travellers: activity?.travellers || [],
    },
  });

  const handleFormSubmit = async (values: ActivityFormSchema) => {
    setSaving(true);

    try {
      let existingExpenseId = activity?.expenseId;
      if (existingExpenseId && expenseMap && !expenseMap.has(existingExpenseId)) {
        existingExpenseId = undefined;
      }

      const hasCost = values.cost && values.cost > 0;

      const payload: SaveEntityPayload = {
        entityId: activity?.id,
        existingExpenseId: existingExpenseId || '',
        existingAttachmentIds: (exitingAttachments || []).map((a: Attachment) => a.id),
        expense: hasCost
          ? {
              name: `Activity: ${values.name}`,
              cost: { value: values.cost as number, currency: values.currencyCode as string },
              occurredOn: fakeAsUtcString(values.startDate),
              category: 'activities',
            }
          : undefined,
        entityData: {
          name: values.name,
          description: values.description,
          address: values.address,
          startDate: fakeAsUtcString(values.startDate),
          endDate: fakeAsUtcString(values.endDate),
          link: values.link,
          travellers: values.travellers || [],
          cost: { value: values.cost, currency: values.currencyCode },
          metadata: { place: values.place },
        },
      };

      await saveActivity(trip.id, payload, files);
      onSuccess();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
      <Grid>
        <Grid.Col span={12}>
          <TextInput
            name={'name'}
            label={t('activity_name', 'Name')}
            description={t('activity_name_desc', 'Name of the activity e.g. Hike to Diamond Head')}
            required
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            name={'address'}
            label={t('activity_description', 'Description')}
            description={t('activity_desc_desc', 'More description if required')}
            key={form.key('description')}
            {...form.getInputProps('description')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <PlaceSelect
            form={form as UseFormReturnType<unknown>}
            propName={'place'}
            presetDestinations={trip.destinations || []}
            label={i18n.t('activity_place', 'Destination')}
            description={i18n.t('activity_place_desc', 'Associated destination')}
            key={form.key('place')}
            {...form.getInputProps('place')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'address'}
            label={t('activity_address', 'Address')}
            description={t('activity_address_desc', 'Location of the activity')}
            required
            key={form.key('address')}
            {...form.getInputProps('address')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateTimePicker
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
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateTimePicker
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
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'link'}
            label={t('link', 'Link')}
            key={form.key('link')}
            description={t('link_desc', 'Related link')}
            {...form.getInputProps('link')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <CurrencyInput
            costKey={form.key('cost')}
            costProps={form.getInputProps('cost')}
            currencyCodeKey={form.key('currencyCode')}
            currencyCodeProps={form.getInputProps('currencyCode')}
            label={t('activity_cost', 'Cost')}
            description={t('activity_cost_desc', 'Charges for this activity')}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <TravellerMultiSelect
            tripTravellers={tripTravellers}
            value={form.getValues().travellers}
            onChange={(value) => form.setFieldValue('travellers', value)}
            formKey={form.key('travellers')}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <AttachmentsUploadField files={files} setFiles={setFiles} />
        </Grid.Col>
      </Grid>

      <Group justify={'flex-end'} pt={'lg'}>
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
    </form>
  );
};
