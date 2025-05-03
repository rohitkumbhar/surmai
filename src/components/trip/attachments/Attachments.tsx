import { Attachment } from '../../../types/trips.ts';
import { Anchor, Badge, CloseButton, Divider, Group, Text } from '@mantine/core';
import { getAttachmentUrl } from '../../../lib/api';
import {
  IconFile,
  IconFileTypeBmp,
  IconFileTypeHtml,
  IconFileTypeJpg,
  IconFileTypePdf,
  IconFileTypePng,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import { showDeleteNotification } from '../../../lib/notifications.tsx';

export const Attachments = ({
  attachments,
  onDelete,
}: {
  attachments: Attachment[];
  onDelete: (attachmentName: string) => Promise<unknown>;
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');

  const getFileTypeIcon = (name: string) => {
    const fileName = name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      return <IconFileTypePdf />;
    } else if (fileName.endsWith('.png')) {
      return <IconFileTypePng />;
    } else if (fileName.endsWith('.bmp')) {
      return <IconFileTypeBmp />;
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      return <IconFileTypeJpg />;
    } else if (fileName.endsWith('.html')) {
      return <IconFileTypeHtml />;
    }
    return <IconFile />;
  };

  return (
    <>
      <Divider />
      {attachments && attachments.length > 0 && (
        <Group p={'sm'}>
          {(attachments || []).map((entry: Attachment) => {
            return (
              <Badge
                key={entry.id}
                variant={'transparent'}
                size={'md'}
                tt={'none'}
                radius={0}
                leftSection={getFileTypeIcon(entry.name)}
                rightSection={
                  <CloseButton
                    title={t('delete_attachment', 'Delete Attachment')}
                    onClick={(event) => {
                      event.preventDefault();
                      openConfirmModal({
                        title: t('delete_attachment', 'Delete Attachment'),
                        confirmProps: { color: 'red' },
                        children: (
                          <Text size="sm">
                            {t(
                              'attachment_deletion_confirmation',
                              'Deleting "{{attachmentName}}". This action cannot be undone.',
                              { attachmentName: entry }
                            )}
                          </Text>
                        ),
                        labels: {
                          confirm: t('delete', 'Delete'),
                          cancel: t('cancel', 'Cancel'),
                        },
                        onCancel: () => {},
                        onConfirm: () => {
                          onDelete(entry.id).then(() => {
                            showDeleteNotification({
                              title: t('attachments', 'Attachments'),
                              message: t('attachment_deleted', 'Attachment {{name}} has been deleted', {
                                name: entry.name,
                              }),
                            });
                          });
                        },
                      });
                    }}
                  />
                }
              >
                <Anchor
                  href={'#'}
                  target={'_blank'}
                  onClick={(event) => {
                    event.preventDefault();
                    const url = getAttachmentUrl(entry, entry.file);
                    openContextModal({
                      modal: 'attachmentViewer',
                      title: entry.name,
                      radius: 'md',
                      withCloseButton: true,
                      fullScreen: isMobile,
                      size: 'auto',
                      innerProps: {
                        fileName: entry.name,
                        attachmentUrl: url,
                      },
                    });
                  }}
                  rel="noreferrer"
                  key={entry.id}
                >
                  {entry.name}
                </Anchor>
              </Badge>
            );
          })}
        </Group>
      )}
    </>
  );
};
