import { Avatar, Group, Menu, rem, UnstyledButton } from '@mantine/core';
import { IconLogout, IconSettings } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { currentUser, logoutCurrentUser } from '../../lib';
import { useEffect, useState } from 'react';
import { User } from '../../types/auth.ts';

export function UserButton() {
  const [, setUserMenuOpened] = useState(false);
  const [user, setCurrentUser] = useState<User>();
  const navigate = useNavigate();

  useEffect(() => {
    currentUser().then((currentUser) => {
      setCurrentUser(currentUser);
    });
  }, []);

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
              style={{ background: 'white' }}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user?.name}</Menu.Label>
        <Link to={'/profile'}>
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
}
