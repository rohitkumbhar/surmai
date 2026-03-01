import { Avatar, Card, Group, Modal, rem, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { TravellerProfileForm } from '../../traveller/TravellerProfileForm.tsx';
import { TravellerProfileModal } from '../../traveller/TravellerProfileModal.tsx';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { updateTravellerProfile, uploadTravellerAttachments } from '../../../lib/api/index.ts';
import type { NewTravellerProfile, TravellerProfile } from '../../../types/trips.ts';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const TravellerCard = ({ profile }: { profile: TravellerProfile }) => {
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();

  const canEdit =
    profile.ownerId === currentUser?.id ||
    profile.managers?.some((m) => m.id === currentUser?.id);

  const updateMutation = useMutation({
    mutationFn: async ({ data, files }: { data: Partial<NewTravellerProfile>; files: File[] }) => {
      await updateTravellerProfile(profile.id, data);
      if (files.length > 0) {
        await uploadTravellerAttachments(profile.id, files);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveller_profiles'] });
      notifications.show({
        title: t('success', 'Success'),
        message: t('profile_updated', 'Traveller profile updated successfully'),
        color: 'green',
      });
      closeEdit();
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('error', 'Error'),
        message: error.message,
        color: 'red',
      });
    },
  });

  return (
    <>
      <Card
        withBorder
        padding="sm"
        radius="md"
        style={{ width: rem(300), cursor: 'pointer' }}
        onClick={openView}
      >
        <Group wrap="nowrap">
          <Avatar color="blue" radius="xl">
            {getInitials(profile.legalName)}
          </Avatar>
          <Stack gap={0} style={{ flex: 1 }}>
            <Text size="sm" fw={500}>
              {profile.legalName}
            </Text>
            <Text size="xs" c="dimmed">
              {profile.email}
            </Text>
          </Stack>
        </Group>
      </Card>

      <TravellerProfileModal
        profile={profile}
        opened={viewOpened}
        onClose={closeView}
        onEdit={canEdit ? () => { closeView(); openEdit(); } : undefined}
      />

      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title={t('edit_profile', 'Edit Profile')}
      >
        <TravellerProfileForm
          initialValues={profile}
          onSubmit={(data, files) => updateMutation.mutate({ data, files })}
          onCancel={closeEdit}
          isOwner={profile.ownerId === currentUser?.id}
        />
      </Modal>
    </>
  );
};
