import classes from './UserInfo.module.css';
import { Avatar, Group, Menu, rem, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconLogout, IconPinInvoke, IconUser } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAttachmentUrl, listInvitations, logoutCurrentUser } from '../../lib/api';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Invitation } from '../../types/invitations.ts';

export const UserInfo = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { t } = useTranslation();

  const { data: invitations } = useQuery<Invitation[]>({
    queryKey: ['listInvitations'],
    queryFn: () => listInvitations(),
  });

  return (
    <Menu position="bottom-end" withinPortal width={'xl'}>
      <Menu.Target>
        <UnstyledButton>
          <Group>
            <Avatar
              src={user?.avatar ? getAttachmentUrl(user, user.avatar) : null}
              alt={user?.name}
              name={user?.name}
              radius="xl"
            />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {user?.name}
              </Text>
              <Text c="dimmed" size="xs">
                {user?.email}
              </Text>
            </div>
            <IconChevronDown style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Link to={'/profile'} className={classes.menuLink}>
          <Menu.Item leftSection={<IconUser style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
            {t('profile', 'Profile')}
          </Menu.Item>
        </Link>
        <Link to={'/invitations'} className={classes.menuLink}>
          <Menu.Item leftSection={<IconPinInvoke style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
            {t('invitations', 'Invitations')} {invitations && invitations.length > 0 ? ` (${invitations.length})` : ''}
          </Menu.Item>
        </Link>
        <Menu.Item
          onClick={async () => {
            await logoutCurrentUser();
            navigate(0);
          }}
          leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          {t('logout', 'Logout')}
        </Menu.Item>
        {import.meta.env.PACKAGE_VERSION && (
          <>
            <Menu.Divider />
            <Menu.Item>
              <Text size={'xs'} c={'dimmed'}>{`Version ${import.meta.env.PACKAGE_VERSION}`}</Text>
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};
