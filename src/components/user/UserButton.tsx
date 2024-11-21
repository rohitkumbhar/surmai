import { Avatar, Group, Menu, rem, UnstyledButton } from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAttachmentUrl, logoutCurrentUser } from '../../lib';
import { useState } from 'react';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { useTranslation } from 'react-i18next';

export function UserButton() {
  const [, setUserMenuOpened] = useState(false);
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <Menu
      position="top-end"
      transitionProps={{ transition: 'pop-top-right' }}
      onClose={() => setUserMenuOpened(false)}
      onOpen={() => setUserMenuOpened(true)}
    >
      <Menu.Target>
        <UnstyledButton>
          <Group>
            <Avatar
              radius="xl"
              alt={user?.name}
              name={user?.name}
              src={user?.avatar && getAttachmentUrl(user, user.avatar)}
              style={{ background: 'white' }}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user?.name}</Menu.Label>
        <Link to={'/profile'}>
          <Menu.Item leftSection={<IconUser style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
            {t('profile', 'Profile')}
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
      </Menu.Dropdown>
    </Menu>
  );
}
