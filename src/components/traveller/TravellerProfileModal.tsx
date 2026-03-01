import { Anchor, Avatar, Button, Divider, Group, Modal, rem, Stack, Text, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconEdit, IconFile } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { getAttachmentUrl } from '../../lib/api/index.ts';

import type { TravellerProfile } from '../../types/trips.ts';

interface Props {
  profile: TravellerProfile | null;
  opened: boolean;
  onClose: () => void;
  onEdit?: (profile: TravellerProfile) => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const TravellerProfileModal = ({ profile, opened, onClose, onEdit }: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!profile) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('traveller_profile', 'Traveller Profile')}
      size="md"
      fullScreen={isMobile}
    >
      <Stack gap="md">
        <Group>
          <Avatar color="blue" radius="xl" size="lg">
            {getInitials(profile.legalName)}
          </Avatar>
          <Stack gap={0}>
            <Text fw={600} size="lg">
              {profile.legalName}
            </Text>
            <Text size="sm" c="dimmed">
              {profile.email}
            </Text>
          </Stack>
        </Group>

        {profile.passportId && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t('passport_id', 'Passport ID')}
              </Text>
              <Text size="sm">{profile.passportId}</Text>
            </Stack>
          </>
        )}

        {profile.additionalFields && profile.additionalFields.length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t('additional_fields', 'Additional Fields')}
              </Text>
              <Stack gap="xs">
                {profile.additionalFields.map((field, idx) => (
                  <Group key={idx} gap="sm">
                    <Text size="sm" fw={500}>
                      {field.label}:
                    </Text>
                    <Text size="sm">{field.value}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </>
        )}

        {profile.attachments && profile.attachments.length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t('attachments', 'Attachments')}
              </Text>
              <Group gap="xs">
                {profile.attachments.map((file, idx) => (
                  <Tooltip key={idx} label={file}>
                    <Anchor href={getAttachmentUrl(profile, file)} target="_blank" size="sm">
                      <Group gap={4}>
                        <IconFile style={{ width: rem(16), height: rem(16) }} />
                        <Text size="xs">{file}</Text>
                      </Group>
                    </Anchor>
                  </Tooltip>
                ))}
              </Group>
            </Stack>
          </>
        )}

        {profile.managers && profile.managers.length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {t('managers', 'Managers')}
              </Text>
              <Stack gap={4}>
                {profile.managers.map((manager) => (
                  <Text key={manager.id} size="sm">
                    {manager.name ? `${manager.name} (${manager.email})` : manager.email}
                  </Text>
                ))}
              </Stack>
            </Stack>
          </>
        )}

        {onEdit && (
          <Group justify="flex-end" mt="sm">
            <Button
              leftSection={<IconEdit style={{ width: rem(16), height: rem(16) }} />}
              onClick={() => onEdit(profile)}
            >
              {t('edit', 'Edit')}
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
