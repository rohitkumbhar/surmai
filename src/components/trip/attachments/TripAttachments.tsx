import { Attachment, Trip } from '../../../types/trips.ts';
import { ActionIcon, Anchor, Button, FileButton, Group, Paper, ScrollArea, Table, Text } from '@mantine/core';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { deleteAttachment, getAttachmentUrl, uploadAttachments } from '../../../lib/api';
import { useMediaQuery } from '@mantine/hooks';
import { showDeleteNotification, showErrorNotification } from '../../../lib/notifications.tsx';

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

  const rows = (tripAttachments || []).map((attachment: Attachment) => {
    return (
      <Table.Tr key={attachment.id}>
        <Table.Td>
          <Group gap="sm">
            <Anchor
              href={'#'}
              target={'_blank'}
              onClick={(event) => {
                event.preventDefault();
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
              }}
              rel="noreferrer"
              key={attachment.id}
            >
              {attachment.name}
            </Anchor>
          </Group>
        </Table.Td>

        <Table.Td>
          <Group>
            <ActionIcon
              variant="default"
              size="xl"
              aria-label={t('delete_attachment', 'Delete Attachment')}
              onClick={() => {
                openConfirmModal({
                  title: t('delete_attachment', 'Delete Attachment'),
                  confirmProps: { color: 'red' },
                  children: (
                    <Text size="sm">
                      {t(
                        'attachment_deletion_confirmation',
                        'Deleting "{{attachmentName}}". This action cannot be undone.',
                        { attachmentName: attachment.name }
                      )}
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
              }}
              title={t('delete_attachment', 'Delete Attachment')}
            >
              <IconTrash size={20} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Paper bg={'var(--mantine-color-body)'} mt={'md'} p={'md'}>
      <Group justify={'flex-end'} mt={'md'}>
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
      <ScrollArea mt={'md'}>
        <Table miw={800} verticalSpacing="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('file_name', 'File Name')}</Table.Th>
              <Table.Th>{t('actions', 'Actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
};
