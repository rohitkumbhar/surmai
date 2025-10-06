import { ActionIcon, Avatar, Card, Group, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { IconTrash } from '@tabler/icons-react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { deleteCollaborator, getAttachmentUrl } from '../../../../lib/api';

import type { User } from '../../../../types/auth.ts';
import type { Trip } from '../../../../types/trips.ts';

export const CollaboratorButton = forwardRef<
  HTMLDivElement,
  {
    trip: Trip;
    user: User;
    onSave: () => void;
  }
>((props, ref) => {
  const { t } = useTranslation();
  const { trip, user, onSave } = props;
  const { name, avatar } = user;
  return (
    <div ref={ref}>
      <Card withBorder radius="xs" p={'xs'}>
        <Group>
          <Avatar
            size={'sm'}
            key={name}
            name={name}
            src={avatar ? getAttachmentUrl(user, avatar) : null}
            color="initials"
          />
          <div>
            <Text size={'sm'}>{name}</Text>
          </div>
          <ActionIcon
            size={'xs'}
            variant="subtle"
            aria-label={t('delete_collaborator', 'Delete Collaborator')}
            c={'red'}
            onClick={() => {
              openConfirmModal({
                title: t('delete_collaborator', 'Delete Collaborator'),
                confirmProps: { color: 'red' },
                children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
                labels: {
                  confirm: t('delete', 'Delete'),
                  cancel: t('cancel', 'Cancel'),
                },
                onCancel: () => {},
                onConfirm: () => {
                  deleteCollaborator(trip.id, user.id).then(() => {
                    onSave();
                  });
                },
              });
            }}
          >
            <IconTrash stroke={1.5} />
          </ActionIcon>
        </Group>
      </Card>
    </div>
  );
});
