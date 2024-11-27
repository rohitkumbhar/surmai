import { Center, Group, rem, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconHome2, IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import classes from './Navbar.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { FishOne } from '../logo/FishOne.tsx';
import { useClickOutside } from '@mantine/hooks';
import { isAdmin, logoutCurrentUser } from '../../lib';
import { useTranslation } from 'react-i18next';

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;

  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
        <Group>
          <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
          <Text hiddenFrom={'sm'}>{label}</Text>
        </Group>
      </UnstyledButton>
    </Tooltip>
  );
}

interface NavbarProps {
  close?: () => void;
}

export function Navbar({ close }: NavbarProps) {
  const ref = useClickOutside(() => close && close());
  const isCurrentUserAdmin = isAdmin();
  const { t } = useTranslation();
  const mainNav = [
    { icon: IconHome2, label: 'Home', route: '/' },
    { icon: IconSettings, label: 'Settings', route: '/settings', isAdmin: true },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const links = mainNav
    .filter((link) => !link.isAdmin || isCurrentUserAdmin)
    .map((link) => (
      <NavbarLink
        {...link}
        key={link.label}
        active={location.pathname === link.route}
        onClick={() => {
          navigate(link.route);
          close && close();
        }}
      />
    ));

  return (
    <nav className={classes.navbar} ref={ref}>
      <Center>
        <FishOne size={30} />
      </Center>
      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        <Tooltip label={t('profile', 'Profile')} position="right" transitionProps={{ duration: 0 }}>
          <UnstyledButton
            onClick={() => {
              navigate('/profile');
              close && close();
            }}
            className={classes.link}
            data-active={location.pathname === '/profile' || undefined}
          >
            <Group>
              <IconUser style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
              <Text hiddenFrom={'sm'}>{t('profile', 'Profile')}</Text>
            </Group>
          </UnstyledButton>
        </Tooltip>

        <Tooltip label={t('logout', 'Logout')} position="right" transitionProps={{ duration: 0 }}>
          <UnstyledButton
            onClick={async () => {
              await logoutCurrentUser();
              navigate(0);
              close && close();
            }}
            className={classes.link}
            data-active={undefined}
          >
            <Group>
              <IconLogout style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
              <Text hiddenFrom={'sm'}>{t('logout', 'Logout')}</Text>
            </Group>
          </UnstyledButton>
        </Tooltip>

        {/*<div className={classes.link}>
          <UserButton />
        </div>*/}
      </Stack>
    </nav>
  );
}
