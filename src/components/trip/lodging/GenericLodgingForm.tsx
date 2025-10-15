import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { createLodgingEntry, updateLodgingEntry, uploadAttachments, createExpense, updateExpense, deleteExpense } from '../../../lib/api';
import i18n from '../../../lib/i18n.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';

import type { Attachment, CreateLodging, Expense, Lodging, LodgingFormSchema, Trip } from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const GenericLodgingForm = ({
  trip,
  type,
  lodging,
  onSuccess,
  onCancel,
  exitingAttachments,
  expenseMap,
}: {
  trip: Trip;
  lodging?: Lodging;
  type: string;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[] | undefined;
  expenseMap?: Map<string, Expense>;
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);
  
  // Get expense from map if lodging has an expenseId
  const expense = lodging?.expenseId && expenseMap ? expenseMap.get(lodging.expenseId) : undefined;
  
  const form = useForm<LodgingFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      type: type,
      name: lodging?.name,
      address: lodging?.address,
      cost: expense?.cost?.value,
      currencyCode: expense?.cost?.currency || user?.currencyCode || 'USD',
      startDate: lodging?.startDate,
      endDate: lodging?.endDate,
      confirmationCode: lodging?.confirmationCode,
      place: lodging?.metadata?.place?.name || '',
    },
  });

  const handleFormSubmit = async (values: LodgingFormSchema) => {
    setSaving(true);
    
    try {
      // Upload attachments first
      const attachments = await uploadAttachments(trip.id, files);
      
      // Handle expense creation/update/deletion based on cost value
      let expenseId = lodging?.expenseId;
      
      // Check if expenseId exists in expenseMap, set to null if not found
      if (expenseId && expenseMap && !expenseMap.has(expenseId)) {
        expenseId = undefined;
      }
      
      const hasCost = values.cost && values.cost > 0;
      
      if (hasCost) {
        if (expenseId) {
          // Update existing expense - only update cost
          await updateExpense(expenseId, {
            cost: {
              value: values.cost as number,
              currency: values.currencyCode as string,
            },
          });
        } else {
          // Create new expense with all fields
          const expenseData = {
            name: `Lodging: ${values.name}`,
            trip: trip.id,
            cost: {
              value: values.cost as number,
              currency: values.currencyCode as string,
            },
            occurredOn: fakeAsUtcString(values.startDate),
            category: 'lodging',
          };
          const newExpense = await createExpense(expenseData);
          expenseId = newExpense.id;
        }
      } else if (expenseId) {
        // Delete expense if cost is removed
        await deleteExpense(expenseId);
        expenseId = undefined;
      }
      
      // Prepare lodging data
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
        expenseId: expenseId,
      };
      
      // Update or create lodging
      if (lodging?.id) {
        data.attachmentReferences = [
          ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
          ...attachments.map((attachment: Attachment) => attachment.id),
        ];
        await updateLodgingEntry(lodging.id, data as unknown as CreateLodging);
      } else {
        data.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
        await createLodgingEntry(data as unknown as CreateLodging);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving lodging:', error);
    } finally {
      setSaving(false);
    }
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
              miw={rem(260)}
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
              miw={rem(260)}
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
              maxWidth={260}
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
                  accept="application/pdf,image/png,image/jpeg,image/gif,image/webp,text/html"
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
