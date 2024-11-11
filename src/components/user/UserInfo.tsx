import classes from './UserInfo.module.css';
import { useEffect, useState } from 'react';
import { Avatar, Group, Menu, rem, Text, UnstyledButton } from '@mantine/core';
import {
  IconChevronRight,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { currentUser, logoutCurrentUser } from '../../lib';
import { User } from '../../types/auth.ts';

export const UserInfo = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>();
  const [, setUserMenuOpened] = useState(false);

  useEffect(() => {
    currentUser().then((resolvedUser: User) => {
      setUser(resolvedUser);
    });
  }, []);

  return (
    <Menu
      width={260}
      position="top-end"
      transitionProps={{ transition: 'pop-top-right' }}
      onClose={() => setUserMenuOpened(false)}
      onOpen={() => setUserMenuOpened(true)}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton className={classes.user}>
          <Group>
            <Avatar
              src={user?.avatar}
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

            <IconChevronRight
              style={{ width: rem(14), height: rem(14) }}
              stroke={1.5}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Settings</Menu.Label>
        <Link to={'/profile'} className={classes.menuLink}>
          <Menu.Item
            leftSection={
              <IconSettings
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            }
          >
            Profile
          </Menu.Item>
        </Link>
        <Menu.Item
          onClick={async () => {
            await logoutCurrentUser();
            navigate(0);
          }}
          leftSection={
            <IconLogout
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
