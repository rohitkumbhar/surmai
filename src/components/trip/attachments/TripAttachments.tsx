import { ActionIcon, Button, Card, Container, FileButton, Grid, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { deleteAttachment, getAttachmentUrl, uploadAttachments } from '../../../lib/api';
import { showDeleteNotification, showErrorNotification } from '../../../lib/notifications.tsx';

import type { Attachment, Trip } from '../../../types/trips.ts';

export const TripAttachments = ({
  trip,
  tripAttachments,
  refetchTrip,
}: {
  trip: Trip;
  tripAttachments?: Attachment[];
  refetchTrip: () => void;
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');

  const openAttachmentViewer = (attachment: Attachment) => {
    const url = getAttachmentUrl(attachment, attachment.file);
    openContextModal({
      modal: 'attachmentViewer',
      title: attachment.name,
      radius: 'md',
      withCloseButton: true,
      fullScreen: isMobile,
      size: 'auto',
      innerProps: {
        fileName: attachment.name,
        attachmentUrl: url,
      },
    });
  };

  const handleDelete = (attachment: Attachment, event: React.MouseEvent) => {
    event.stopPropagation();
    openConfirmModal({
      title: t('delete_attachment', 'Delete Attachment'),
      confirmProps: { color: 'red' },
      children: (
        <Text size="sm">
          {t('attachment_deletion_confirmation', 'Deleting "{{attachmentName}}". This action cannot be undone.', {
            attachmentName: attachment.name,
          })}
        </Text>
      ),
      labels: {
        confirm: t('delete', 'Delete'),
        cancel: t('cancel', 'Cancel'),
      },
      onCancel: () => {},
      onConfirm: () => {
        deleteAttachment(attachment.id).then(() => {
          refetchTrip();
          showDeleteNotification({
            title: t('attachments', 'Attachments'),
            message: t('attachment_deleted', 'Attachment {{name}} has been deleted', {
              name: attachment.name,
            }),
          });
        });
      },
    });
  };

  return (
    <Container mt={'sm'} size={'xl'}>
      <Group justify={'space-between'} align={'center'}>
        <Text size={'sm'} c={'dimmed'}>
          {t('all_attachments_desc', 'All attachments from Transportations, Lodgings, Activities and Expenses')}
        </Text>
        <FileButton
          onChange={(files: File[]) => {
            uploadAttachments(trip.id, files)
              .then(() => {
                refetchTrip();
              })
              .catch((err) => {
                showErrorNotification({
                  error: err,
                  title: t('attachment_upload_failed', 'Failed to upload attachments'),
                  message: t('attachment_upload_failed_desc', 'Try again with fewer files or smaller files'),
                });
              });
          }}
          accept="application/pdf,image/png,image/jpeg,image/gif,image/webp,text/html"
          form={'files'}
          name={'files'}
          multiple
        >
          {(props) => {
            return (
              <Button {...props} leftSection={<IconUpload height={20} />}>
                {t('upload', 'Upload')}
              </Button>
            );
          }}
        </FileButton>
      </Group>
      {(!tripAttachments || tripAttachments.length === 0) && (
        <Card withBorder padding="lg" radius="md" mt={'sm'}>
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {t('no_attachments', 'No attachments yet')}
          </Text>
        </Card>
      )}
      <Grid gutter="md" mt={'sm'}>
        {(tripAttachments || []).map((attachment: Attachment) => (
          <Grid.Col key={attachment.id} span={{ base: 12, sm: 6, md: 4 }}>
            <Card
              withBorder
              padding="md"
              radius="md"
              style={{ cursor: 'pointer' }}
              onClick={() => openAttachmentViewer(attachment)}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={4} style={{ flex: 1, overflow: 'hidden' }}>
                  <Text fw={500} size="sm" lineClamp={2}>
                    {attachment.name}
                  </Text>
                </Stack>
                <ActionIcon
                  variant="default"
                  color="red"
                  aria-label={t('delete_attachment', 'Delete Attachment')}
                  onClick={(event) => handleDelete(attachment, event)}
                  title={t('delete_attachment', 'Delete Attachment')}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
};
