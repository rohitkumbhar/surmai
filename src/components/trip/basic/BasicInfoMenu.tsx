import { useTranslation } from 'react-i18next';
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { Button, Menu, rem, Text } from '@mantine/core';
import {
  IconCalendar,
  IconChevronDown,
  IconDownload,
  IconPackageExport,
  IconPencil,
  IconPhoto,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { deleteTrip, loadEverything, uploadTripCoverImage } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { showDeleteNotification, showErrorNotification, showInfoNotification } from '../../../lib/notifications.tsx';

export const BasicInfoMenu = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 50em)');

  const [, setOfflineCacheTimestamp] = useLocalStorage<string | null>({
    key: `offline-cache-timestamp-${trip.id}`,
  });

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
              size: 'auto',
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
              title: t('trip_add_cover_image', 'Add Cover Image'),
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
          {t('trip_cover_image', 'Cover Image')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'collaboratorsForm',
              title: t('trip_invite_collaborators', 'Invite Collaborators'),
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
          {t('trip_collaborators', 'Collaborators')}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            loadEverything(trip.id)
              .then(() => {
                setOfflineCacheTimestamp(dayjs().format('L LT'));
                showInfoNotification({
                  title: t('offline_access', 'Offline Access'),
                  message: t('offline_access_enabled', 'Data for {{tripName}} has been added to the cache', {
                    tripName: trip.name,
                  }),
                });
              })
              .catch((err) => {
                setOfflineCacheTimestamp(null);
                showErrorNotification({
                  error: err,
                  title: t('offline_access', 'Offline Access'),
                  message: t('offline_access_failed', 'Data for {{tripName}} could not added to the cache', {
                    tripName: trip.name,
                  }),
                });
              });
          }}
          leftSection={<IconDownload style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('enable_offline', 'Enable Offline')}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'exportTripModal',
              title: t('trip_export', 'Export Trip Data'),
              withCloseButton: true,
              fullScreen: isMobile,
              size: 'lg',
              innerProps: {
                trip: trip,
              },
            });
          }}
          leftSection={<IconPackageExport style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('export_trip', 'Export Trip')}
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            openContextModal({
              modal: 'exportTripCalendarModal',
              title: t('download_icalendar', 'Download iCalendar File'),
              withCloseButton: true,
              fullScreen: isMobile,
              size: 'lg',
              innerProps: {
                trip: trip,
              },
            });
          }}
          leftSection={<IconCalendar style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('add_to_calendar', 'Add To Calendar')}
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
                  showDeleteNotification({
                    title: t('trip_deleted', 'Trip Deleted'),
                    message: t('trip_deleted_detail', 'Trip {{name}} has been deleted', { name: trip.name }),
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
