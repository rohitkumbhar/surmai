import { useQuery } from '@tanstack/react-query';
import { deleteUserAdminAction, getAttachmentUrl, listAllUsers } from '../../lib/api';
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Container,
  Group,
  LoadingOverlay,
  Modal,
  Pagination,
  ScrollArea,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconKey, IconTrash } from '@tabler/icons-react';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { ChangeUserPasswordForm } from './ChangeUserPasswordForm.tsx';
import { useState } from 'react';
import { User } from '../../types/auth.ts';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { showDeleteNotification } from '../../lib/notifications.tsx';

export const UserList = () => {
  const { user: currentUser } = useCurrentUser();
  const { t } = useTranslation();
  const [changePasswordFormOpened, { open: openChangePasswordForm, close: closeChangePasswordForm }] =
    useDisclosure(false);

  const [changePasswordUser, setChangePasswordUser] = useState<User | undefined>();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [activePage, setPage] = useState(1);

  const {
    isPending: fetchUserListPending,
    data: result,
    refetch: refetchAllUsers,
  } = useQuery({
    queryKey: ['listAllUsers', activePage],
    queryFn: () => listAllUsers(activePage),
  });

  const users = result?.items || [];
  const rows = users.map((item) => {
    return (
      <Table.Tr key={item.id}>
        <Table.Td>
          <Group gap="sm">
            <Avatar
              size={26}
              src={item.avatar ? getAttachmentUrl(item, item.avatar) : ''}
              name={item.name}
              radius={26}
            />
            <Text fw={500}>{item.name}</Text>
            {currentUser?.email === item.email && (
              <Text c={'dimmed'} size={'sm'}>
                {t('this_is_you', '(You)')}
              </Text>
            )}
          </Group>
        </Table.Td>
        <Table.Td>{item.email}</Table.Td>
        <Table.Td>
          <Group>
            <ActionIcon
              variant={'default'}
              size="xl"
              aria-label={t('change_password', 'Change Password')}
              disabled={currentUser?.email === item.email}
              onClick={() => {
                setChangePasswordUser(item);
                openChangePasswordForm();
              }}
              title={t('change_password', 'Change Password')}
            >
              <IconKey size={20} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              size="xl"
              aria-label={t('delete_user', 'Delete User')}
              disabled={currentUser?.email === item.email}
              onClick={() => {
                openConfirmModal({
                  title: t('delete_user', 'Delete User'),
                  confirmProps: { color: 'red' },
                  children: (
                    <Container>
                      <Text>{t('deleting_user', 'Deleting {{name}}', { name: item.name })}</Text>
                      <Text mt={'md'} size="sm">
                        {t(
                          'user_deletion_confirmation',
                          'Deleting a user will delete all trips created by this user. This action cannot be undone.'
                        )}
                      </Text>
                    </Container>
                  ),
                  labels: {
                    confirm: t('delete', 'Delete'),
                    cancel: t('cancel', 'Cancel'),
                  },
                  onCancel: () => {},
                  onConfirm: () => {
                    deleteUserAdminAction(item.id)
                      .then(() => {
                        showDeleteNotification({
                          title: t('user_deleted', 'User Deleted'),
                          message: t('user_deleted_detail', 'User {{name}} has been deleted', { name: item.name }),
                        });
                      })
                      .finally(() => refetchAllUsers());
                  },
                });
              }}
              title={t('delete_user', 'Delete User')}
            >
              <IconTrash size={20} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        {t('users_section', 'Users')}
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        {t('users_section_description', 'Manage site users')}
      </Text>

      <div style={{ width: '100%' }}>
        <Modal
          opened={changePasswordFormOpened}
          fullScreen={isMobile}
          size="auto"
          title={t('admin_change_password', 'Change Password')}
          onClose={() => {
            closeChangePasswordForm();
          }}
        >
          {changePasswordUser && (
            <ChangeUserPasswordForm
              user={changePasswordUser}
              successFn={closeChangePasswordForm}
              errorFn={closeChangePasswordForm}
            />
          )}
        </Modal>
        <LoadingOverlay
          visible={fetchUserListPending}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ type: 'bars' }}
        />
        <Group justify={'flex-end'} gap={'xl'}>
          {result && result.totalPages > 1 && (
            <Pagination value={activePage} onChange={setPage} total={result.totalPages} />
          )}
          <Button
            onClick={() => {
              openContextModal({
                modal: 'inviteUsersFormModal',
                title: t('invite_new_user', 'Invite New User'),
                radius: 'md',
                withCloseButton: false,
                size: 'auto',
                fullScreen: isMobile,
                innerProps: {},
              });
            }}
          >
            Invite User
          </Button>
        </Group>
        <ScrollArea mt={'md'}>
          <Table miw={800} verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('name', 'Name')}</Table.Th>
                <Table.Th>{t('email', 'Email')}</Table.Th>
                <Table.Th>{t('actions', 'Actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
};
