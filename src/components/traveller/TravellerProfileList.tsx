import { ActionIcon, Button, Card, Group, Modal, rem, Stack, Table, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';

import { useSurmaiContext } from '../../app/useSurmaiContext.ts';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import {
  createTravellerProfile,
  deleteTravellerProfile,
  listOtherTravellerProfiles,
  listTravellerProfiles,
  updateTravellerProfile,
  uploadTravellerAttachments,
} from '../../lib/api/index.ts';
import { TravellerProfileForm } from './TravellerProfileForm.tsx';
import { TravellerProfileModal } from './TravellerProfileModal.tsx';

import type { NewTravellerProfile, TravellerProfile } from '../../types/trips.ts';

export const TravellerProfileList = ({ excludeEmail }: { excludeEmail?: string } = {}) => {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [editingProfile, setEditingProfile] = useState<TravellerProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<TravellerProfile | null>(null);

  const { user: currentUser } = useCurrentUser();
  const { isMobile } = useSurmaiContext();
  const queryKey = excludeEmail ? ['traveller_profiles', { excludeEmail }] : ['traveller_profiles'];
  const queryFn = excludeEmail ? () => listOtherTravellerProfiles(excludeEmail) : listTravellerProfiles;

  const { data: profiles, isLoading } = useQuery({
    queryKey,
    queryFn,
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, files }: { data: Partial<NewTravellerProfile>; files: File[] }) => {
      // Set current user as owner if not set
      if (!data.ownerId) {
        data.ownerId = currentUser?.id;
      }
      const profile = await createTravellerProfile(data);
      if (files.length > 0) {
        await uploadTravellerAttachments(profile.id, files);
      }
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveller_profiles'] }).then(() => {
        notifications.show({
          title: t('success', 'Success'),
          message: t('profile_created', 'Traveler profile created successfully'),
          color: 'green',
        });
        close();
      });
    },
    onError: (error) => {
      notifications.show({
        title: t('error', 'Error'),
        message: error.message,
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, files }: { id: string; data: Partial<TravellerProfile>; files: File[] }) => {
      await updateTravellerProfile(id, data);
      if (files.length > 0) {
        await uploadTravellerAttachments(id, files);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveller_profiles'] });
      notifications.show({
        title: t('success', 'Success'),
        message: t('profile_updated', 'Traveler profile updated successfully'),
        color: 'green',
      });
      close();
    },
    onError: (error) => {
      notifications.show({
        title: t('error', 'Error'),
        message: error.message,
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTravellerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traveller_profiles'] });
      notifications.show({
        title: t('success', 'Success'),
        message: t('profile_deleted', 'Traveler profile deleted successfully'),
        color: 'green',
      });
    },
  });

  const handleEdit = (profile: TravellerProfile) => {
    setEditingProfile(profile);
    open();
  };

  const handleAdd = () => {
    setEditingProfile(null);
    open();
  };

  const handleView = (profile: TravellerProfile) => {
    setViewingProfile(profile);
    openView();
  };

  const handleSubmit = (data: Partial<NewTravellerProfile>, files: File[]) => {
    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, data, files });
    } else {
      createMutation.mutate({ data, files });
    }
  };

  const rows = (profiles || []).map((profile) => (
    <Table.Tr key={profile.id}>
      <Table.Td>
        <UnstyledButton onClick={() => handleView(profile)} style={{ color: 'inherit' }}>
          <Text size="sm" style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
            {profile.legalName}
          </Text>
        </UnstyledButton>
      </Table.Td>
      <Table.Td>{profile.email}</Table.Td>
      <Table.Td>{profile.passportId || '-'}</Table.Td>
      <Table.Td>
        <Group justify="flex-end">
          <ActionIcon
            variant={'subtle'}
            onClick={() => handleEdit(profile)}
            disabled={profile.ownerId !== currentUser?.id && !profile.managers?.some((m) => m.id === currentUser!.id)}
          >
            <IconEdit style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant={'subtle'}
            color={'red'}
            onClick={() => {
              openConfirmModal({
                confirmProps: { color: 'red' },
                title: t('delete_profile_confirmation', 'Delete Traveler Profile'),
                children: (
                  <Text size="sm">{t('confirm_delete_profile', 'Are you sure you want to delete this profile?')}</Text>
                ),
                labels: { confirm: 'Confirm', cancel: 'Cancel' },
                onCancel: () => {},
                onConfirm: () => {
                  deleteMutation.mutate(profile.id);
                },
              });
            }}
            disabled={profile.ownerId !== currentUser?.id}
          >
            <IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Card withBorder radius="md">
      <Stack>
        <Group justify="space-between">
          <Text fw={500} size="lg">
            {t('traveller_profiles', 'Traveler Profiles')}
          </Text>
          <Button leftSection={<IconPlus size={14} />} onClick={handleAdd}>
            {t('add_profile', 'Add Profile')}
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('legal_name', 'Legal Name')}</Table.Th>
                <Table.Th>{t('email', 'Email')}</Table.Th>
                <Table.Th>{t('passport_id', 'Passport ID')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows}
              {profiles?.length === 0 && !isLoading && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="xl">
                      {t('no_profiles_found', 'No traveler profiles found')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title={editingProfile ? t('edit_profile', 'Edit Profile') : t('add_profile', 'Add Profile')}
        fullScreen={isMobile}
      >
        <TravellerProfileForm
          initialValues={editingProfile || undefined}
          onSubmit={handleSubmit}
          onCancel={close}
          isOwner={!editingProfile || editingProfile.ownerId === currentUser?.id}
        />
      </Modal>

      <TravellerProfileModal
        profile={viewingProfile}
        opened={viewOpened}
        onClose={closeView}
        onEdit={(profile) => {
          closeView();
          handleEdit(profile);
        }}
      />
    </Card>
  );
};
