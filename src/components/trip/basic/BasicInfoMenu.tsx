import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { Button, Menu, rem, Text } from '@mantine/core';
import { IconChevronDown, IconDownload, IconPencil, IconPhoto, IconTrash, IconUsers } from '@tabler/icons-react';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { deleteTrip, loadEverything, uploadTripCoverImage } from '../../../lib';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

export const BasicInfoMenu = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <Menu>
      <Menu.Target>
        <Button rightSection={<IconChevronDown style={{ width: rem(18), height: rem(18) }} stroke={1.5} />} pr={12}>
          {t('actions', 'Actions')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'editBasicInfoForm',
              title: t('edit_trip', 'Edit Trip'),
              radius: 'md',
              withCloseButton: false,
              fullScreen: isMobile,
              innerProps: {
                trip: trip,
                onSave: () => {
                  refetch();
                },
              },
            });
          }}
          leftSection={<IconPencil style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('edit', 'Edit')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'uploadImageForm',
              title: t('basic.add_cover_image', 'Add Cover Image'),
              radius: 'md',
              withCloseButton: false,
              size: 'auto',
              fullScreen: isMobile,
              innerProps: {
                aspectRatio: 1920 / 800,
                saveUploadedImage: (uploadedImage: File | Blob) => {
                  uploadTripCoverImage(trip.id, uploadedImage).then(() => {
                    refetch();
                  });
                },
              },
            });
          }}
          leftSection={<IconPhoto style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('basic.add_cover_image', 'Add Cover Image')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'collaboratorsForm',
              title: t('basic.add_collaborators', 'Add Collaborators'),
              radius: 'md',
              withCloseButton: false,
              fullScreen: isMobile,
              size: 'auto',
              innerProps: {
                trip: trip,
                onSave: () => {
                  refetch();
                },
              },
            });
          }}
          leftSection={<IconUsers style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('basic.add_cover_image', 'Add Collaborators')}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            loadEverything(trip.id)
              .then(() => {
                notifications.show({
                  title: 'Offline',
                  message: `Data for ${trip.name} has been added to cache`,
                  position: 'top-right',
                });
              })
              .catch((err) => {
                console.log('Error', err);
                notifications.show({
                  title: 'Downloaded',
                  variant: 'error',
                  message: `Data for ${trip.name} could not be downloaded`,
                  position: 'top-right',
                });
              });
          }}
          leftSection={<IconDownload style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('offline', 'Enable Offline')}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          c={'red'}
          onClick={() => {
            openConfirmModal({
              title: t('delete_trip', 'Delete Trip'),
              confirmProps: { color: 'red' },
              children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
              labels: {
                confirm: t('delete', 'Delete'),
                cancel: t('cancel', 'Cancel'),
              },
              onCancel: () => {},
              onConfirm: () => {
                deleteTrip(trip.id).then(() => {
                  notifications.show({
                    title: 'Deleted',
                    message: `Trip ${trip.name} has been deleted`,
                    position: 'top-right',
                  });
                  refetch();
                  navigate('/');
                });
              },
            });
          }}
          leftSection={<IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('delete', 'Delete')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
