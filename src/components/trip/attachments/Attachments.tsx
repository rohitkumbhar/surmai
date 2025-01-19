import { Activity, Lodging, Transportation } from '../../../types/trips.ts';
import { Anchor, Badge, CloseButton, Divider, Group, Text } from '@mantine/core';
import { getAttachmentUrl } from '../../../lib/api';
import { IconFile, IconFileTypeBmp, IconFileTypeJpg, IconFileTypePdf, IconFileTypePng } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import { showDeleteNotification } from '../../../lib/notifications.tsx';

export const Attachments = ({
  entity,
  refetch,
  onDelete,
}: {
  entity: Transportation | Lodging | Activity;
  refetch: () => void;
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
    }
    return <IconFile />;
  };

  return (
    <>
      <Divider />
      {entity.attachments && entity.attachments.length > 0 && (
        <Group p={'sm'}>
          {(entity.attachments || []).map((attachmentName: string) => {
            return (
              <Badge
                key={attachmentName}
                variant={'transparent'}
                size={'md'}
                tt={'none'}
                radius={0}
                leftSection={getFileTypeIcon(attachmentName)}
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
                              { attachmentName: attachmentName }
                            )}
                          </Text>
                        ),
                        labels: {
                          confirm: t('delete', 'Delete'),
                          cancel: t('cancel', 'Cancel'),
                        },
                        onCancel: () => {},
                        onConfirm: () => {
                          onDelete(attachmentName).then(() => {
                            showDeleteNotification({
                              title: t('attachments', 'Attachments'),
                              message: t('attachment_deleted', 'Attachment {{name}} has been deleted', {
                                name: attachmentName,
                              }),
                            });
                            refetch();
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
                    const url = getAttachmentUrl(entity, attachmentName);
                    openContextModal({
                      modal: 'attachmentViewer',
                      title: attachmentName,
                      radius: 'md',
                      withCloseButton: true,
                      fullScreen: isMobile,
                      size: 'auto',
                      innerProps: {
                        fileName: attachmentName,
                        attachmentUrl: url,
                      },
                    });
                  }}
                  rel="noreferrer"
                  key={attachmentName}
                >
                  {attachmentName}
                </Anchor>
              </Badge>
            );
          })}
        </Group>
      )}
    </>
  );
};
