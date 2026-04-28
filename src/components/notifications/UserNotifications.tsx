import { Accordion, Badge, Box, Group, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listNotifications, markNotificationAsRead } from '../../lib/api';
import type { Notification } from '../../types/notifications';
import dayjs from 'dayjs';

export const UserNotifications = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleToggle = (id: string | null) => {
    if (id) {
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        markAsReadMutation.mutate(id);
      }
    }
  };

  return (
    <Stack>
      {notifications.length === 0 ? (
        <Text c="dimmed">{t('no_notifications', 'No notifications')}</Text>
      ) : (
        <Accordion onChange={handleToggle}>
          {notifications.map((notification) => (
            <Accordion.Item key={notification.id} value={notification.id}>
              <Accordion.Control>
                <Group justify="space-between">
                  <Box>
                    <Text fw={notification.read ? 400 : 700}>{notification.subject}</Text>
                    <Text size="xs" c="dimmed">
                      {notification.sender} • {dayjs(notification.created).fromNow()}
                    </Text>
                  </Box>
                  {!notification.read && (
                    <Badge color="blue" size="sm">
                      {t('new', 'New')}
                    </Badge>
                  )}
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {notification.message || notification.text}
                  </Text>
                  {notification.expiry && (
                    <Text size="xs" c="dimmed">
                      {t('expires_at', 'Expires at')}: {dayjs(notification.expiry).format('LLL')}
                    </Text>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Stack>
  );
};
