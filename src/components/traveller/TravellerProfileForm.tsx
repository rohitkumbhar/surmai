import {
  ActionIcon,
  Button,
  FileInput,
  Group,
  Pill,
  PillGroup,
  rem,
  Select,
  Stack,
  Text,
  TextInput,
  TagsInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  NewTravellerProfile,
  TravellerAdditionalField,
  TravellerProfile,
  TravellerProfileManager,
} from '../../types/trips.ts';

interface TravellerProfileFormProps {
  initialValues?: TravellerProfile;
  onSubmit: (values: Partial<NewTravellerProfile>, files: File[]) => void;
  onCancel: () => void;
  hideCancelButton?: boolean;
  readOnlyEmail?: boolean;
  hideEmail?: boolean;
  isOwner?: boolean;
}

export const TravellerProfileForm = ({
  initialValues,
  onSubmit,
  onCancel,
  hideCancelButton,
  readOnlyEmail,
  hideEmail,
  isOwner,
}: TravellerProfileFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const { t } = useTranslation();

  const ADDITIONAL_FIELD_OPTIONS = [
    { value: 'passport_issue_date', label: t('passport_issue_date', 'Passport Issue Date') },
    { value: 'passport_expiry_date', label: t('passport_expiry_date', 'Passport Expiry Date') },
    { value: 'tsa_precheck', label: t('tsa_precheck', 'TSA PreCheck ID') },
    { value: 'clear_id', label: t('clear_id', 'CLEAR ID') },
    { value: 'known_traveller_number', label: t('known_traveller_number', 'Known Traveler Number (KTN)') },
    { value: 'global_entry', label: t('global_entry', 'Global Entry ID') },
    { value: 'nexus', label: t('nexus', 'NEXUS ID') },
    { value: 'sentri', label: t('sentri', 'SENTRI ID') },
    { value: 'redress_number', label: t('redress_number', 'Redress Number') },
    { value: 'united_mileageplus', label: t('united_mileageplus', 'United MileagePlus') },
    { value: 'american_aadvantage', label: t('american_aadvantage', 'American AAdvantage') },
    { value: 'delta_skymiles', label: t('delta_skymiles', 'Delta SkyMiles') },
    { value: 'southwest_rapid_rewards', label: t('southwest_rapid_rewards', 'Southwest Rapid Rewards') },
    { value: 'jetblue_trueblue', label: t('jetblue_trueblue', 'JetBlue TrueBlue') },
    { value: 'alaska_mileage_plan', label: t('alaska_mileage_plan', 'Alaska Mileage Plan') },
    { value: 'aeroplan', label: t('aeroplan', 'Air Canada Aeroplan') },
    { value: 'ba_executive_club', label: t('ba_executive_club', 'British Airways Executive Club') },
    { value: 'emirates_skywards', label: t('emirates_skywards', 'Emirates Skywards') },
    { value: 'flying_blue', label: t('flying_blue', 'Air France/KLM Flying Blue') },
    { value: 'miles_and_more', label: t('miles_and_more', 'Lufthansa Miles & More') },
    { value: 'singapore_krisflyer', label: t('singapore_krisflyer', 'Singapore KrisFlyer') },
    { value: 'asia_miles', label: t('asia_miles', 'Cathay Pacific Asia Miles') },
    { value: 'qatar_privilege_club', label: t('qatar_privilege_club', 'Qatar Airways Privilege Club') },
    { value: 'turkish_miles_smiles', label: t('turkish_miles_smiles', 'Turkish Airlines Miles&Smiles') },
    { value: 'national_id', label: t('national_id', 'National ID') },
    { value: 'drivers_license', label: t('drivers_license', "Driver's License") },
    { value: 'other', label: t('other', 'Other') },
  ];

  const FIELD_LABELS: Record<string, string> = Object.fromEntries(
    ADDITIONAL_FIELD_OPTIONS.map((o) => [o.value, o.label])
  );

  // Existing managers that will be kept; removals happen before Save
  const [managersToKeep, setManagersToKeep] = useState<TravellerProfileManager[]>(initialValues?.managers || []);
  // New emails entered by the owner — processed by the backend on Save
  const [newManagerEmails, setNewManagerEmails] = useState<string[]>([]);

  const showManagerSection = isOwner && !!initialValues?.id;

  const form = useForm({
    initialValues: {
      email: initialValues?.email || '',
      legalName: initialValues?.legalName || '',
      passportId: initialValues?.passportId || '',
      additionalFields: initialValues?.additionalFields || ([] as TravellerAdditionalField[]),
    },
    validate: {
      email: (value) => (hideEmail || /^\S+@\S+$/.test(value) ? null : t('invalid_email', 'Invalid email')),
      legalName: (value) => (value ? null : t('legal_name_required', 'Legal name is required')),
    },
  });

  const addField = () => {
    form.insertListItem('additionalFields', { key: '', label: '', value: '' });
  };

  const removeField = (index: number) => {
    form.removeListItem('additionalFields', index);
  };

  const handleFieldKeyChange = (index: number, key: string | null) => {
    if (!key) return;
    form.setFieldValue(`additionalFields.${index}.key`, key);
    form.setFieldValue(`additionalFields.${index}.label`, FIELD_LABELS[key] || key);
  };

  const handleSubmit = (values: typeof form.values) => {
    const filtered = values.additionalFields.filter((f) => f.key && f.value.trim() !== '');
    const data: any = { ...values, additionalFields: filtered };
    if (showManagerSection) {
      data.managers = managersToKeep.map((m) => m.id);
      if (newManagerEmails.length > 0) {
        data.addManagerEmails = newManagerEmails;
      }
    }
    onSubmit(data as Partial<NewTravellerProfile>, files);
  };

  const usedKeys = form.values.additionalFields.map((f) => f.key);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {!hideEmail && (
          <TextInput
            label={t('traveller_email', 'Email')}
            placeholder="traveller@example.com"
            description={t('traveller_email_desc', 'Email address of the traveler')}
            required
            readOnly={readOnlyEmail}
            {...form.getInputProps('email')}
          />
        )}
        <TextInput
          label={t('traveller_name', 'Official Name')}
          placeholder="John Doe"
          description={t('traveller_name_desc', 'Name of travel documents e.g. on the passport')}
          required
          {...form.getInputProps('legalName')}
        />
        <TextInput
          label={t('traveller_passport_id', 'Passport ID')}
          description={t('traveller_passport_desc', 'Identification number of the passport')}
          placeholder="ID12345678"
          {...form.getInputProps('passportId')}
        />

        {showManagerSection && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              {t('managers', 'Managers')}
            </Text>
            {managersToKeep.length > 0 && (
              <PillGroup>
                {managersToKeep.map((manager) => (
                  <Pill
                    key={manager.id}
                    withRemoveButton
                    onRemove={() => setManagersToKeep((prev) => prev.filter((m) => m.id !== manager.id))}
                  >
                    {manager.name ? `${manager.name} (${manager.email})` : manager.email}
                  </Pill>
                ))}
              </PillGroup>
            )}
            <TagsInput
              placeholder={t('add_manager_emails_placeholder', 'Type an email and press Enter or comma')}
              description={t('add_manager_emails_desc', 'Profile managers — comma-separated emails')}
              value={newManagerEmails}
              onChange={setNewManagerEmails}
              splitChars={[',']}
            />
          </Stack>
        )}

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {t('traveller_additional_fields', 'Additional ID Fields')}
            </Text>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconPlus style={{ width: rem(14), height: rem(14) }} />}
              onClick={addField}
            >
              {t('add_field', 'Add field')}
            </Button>
          </Group>

          {form.values.additionalFields.map((field, index) => (
            <Group key={index} align="flex-end" gap="xs">
              <Select
                style={{ flex: 1 }}
                label={index === 0 ? t('field_type', 'Field type') : undefined}
                placeholder={t('select_field_type', 'Select type')}
                data={ADDITIONAL_FIELD_OPTIONS.filter((o) => o.value === field.key || !usedKeys.includes(o.value))}
                value={field.key || null}
                onChange={(val) => handleFieldKeyChange(index, val)}
              />
              <TextInput
                style={{ flex: 1 }}
                label={index === 0 ? t('field_value', 'Value') : undefined}
                placeholder={t('enter_value', 'Enter value')}
                {...form.getInputProps(`additionalFields.${index}.value`)}
              />
              <ActionIcon
                color="red"
                variant="subtle"
                mb={index === 0 ? 0 : undefined}
                onClick={() => removeField(index)}
                style={{ marginBottom: index === 0 ? rem(2) : undefined }}
              >
                <IconTrash style={{ width: rem(16), height: rem(16) }} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>

        <FileInput
          label={t('traveller_attachments', 'Attachments')}
          placeholder={t('upload_attachments', 'Upload passport copies, etc.')}
          multiple
          leftSection={<IconUpload style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
          onChange={setFiles}
        />
        {initialValues?.attachments && initialValues.attachments.length > 0 && (
          <div>
            <Text size="sm" fw={500}>
              {t('existing_attachments', 'Existing Attachments')}:
            </Text>
            {initialValues.attachments.map((file, index) => (
              <Text key={index} size="xs" c="dimmed">
                {file}
              </Text>
            ))}
          </div>
        )}

        <Group justify="flex-end" mt="md">
          {!hideCancelButton && (
            <Button variant="outline" onClick={onCancel}>
              {t('cancel', 'Cancel')}
            </Button>
          )}
          <Button type="submit">{t('save', 'Save')}</Button>
        </Group>
      </Stack>
    </form>
  );
};
