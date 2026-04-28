import { ActionIcon, Indicator } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconBell } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { listNotifications } from '../../lib/api';
import { useCurrentUser } from '../../auth/useCurrentUser';
import type { Notification } from '../../types/notifications';

export const NotificationIndicator = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    enabled: !!user,
  });

  const newNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <Indicator
      inline
      label={newNotificationsCount}
      size={20}
      disabled={newNotificationsCount === 0}
      offset={4}
      withBorder
    >
      <ActionIcon variant="subtle" onClick={() => navigate('/profile#notifications')} title="Notifications">
        <IconBell size={24} />
      </ActionIcon>
    </Indicator>
  );
};
