import classes from './UserInfo.module.css';
import { Avatar, Group, Menu, rem, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconLogout, IconUser } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAttachmentUrl, logoutCurrentUser } from '../../lib/api';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';

export const UserInfo = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  return (
    <Menu
      position="top-end"
      transitionProps={{ transition: 'pop-top-right' }}

      withinPortal
    >
      <Menu.Target>
        <UnstyledButton>
          <Group>
            <Avatar src={user?.avatar ? getAttachmentUrl(user, user.avatar) : null} alt={user?.name} name={user?.name}
                    radius="xl" />
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
            Profile
          </Menu.Item>
        </Link>
        <Menu.Item
          onClick={async () => {
            await logoutCurrentUser();
            navigate(0);
          }}
          leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        >
          Logout
        </Menu.Item>
        {import.meta.env.PACKAGE_VERSION && (<>
          <Menu.Divider />
          <Menu.Item>
            <Text size={'xs'} c={'dimmed'}>{`Version ${import.meta.env.PACKAGE_VERSION}`}</Text>
          </Menu.Item></>)}
      </Menu.Dropdown>
    </Menu>
  );
};
