import {
  Alert,
  Anchor,
  AppShell,
  Box,
  Burger,
  Container,
  Group,
  MantineColorScheme,
  rem,
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconInfoCircle } from '@tabler/icons-react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { useSurmaiContext } from './app/useSurmaiContext.ts';
import { useCurrentUser } from './auth/useCurrentUser.ts';
import { Error } from './components/error/Error.tsx';
import { Navbar } from './components/nav/Navbar.tsx';
import { UserInfo } from './components/user/UserInfo.tsx';
import { useDefaultPageTitle } from './lib/hooks/usePageTitle.ts';
import { useEffect } from 'react';
import { updateDayJsLanguage } from './lib/i18n.ts';

function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const { demoMode, changeColor } = useSurmaiContext();

  useDefaultPageTitle();
  const { i18n, t } = useTranslation();
  const { user, reloadUser } = useCurrentUser();

  // this is the website appearance (light, dark, auto)
  const { colorScheme: currentAppearance, setColorScheme: setAppearance } = useMantineColorScheme();
  const { primaryColor } = useMantineTheme();

  useEffect(() => {
    let renderRequired = false;

    if (user?.preferredLanguage !== i18n.language) {
      i18n.changeLanguage(user?.preferredLanguage).then(() => {
        updateDayJsLanguage(user?.preferredLanguage as string);
      });

      renderRequired = true;
    }

    if (user?.websiteAppearance && user?.websiteAppearance !== currentAppearance) {
      setAppearance(user?.websiteAppearance as MantineColorScheme);
      renderRequired = true;
    }
    if (changeColor && primaryColor && user?.colorScheme && primaryColor !== user?.colorScheme) {
      // this is the theme color
      changeColor(user.colorScheme);
      renderRequired = true;
    }

    if (renderRequired) {
      reloadUser?.(false);
    }
  }, [user]);

  return (
    <AppShell
      header={{
        height: { base: rem('60px'), md: rem('60px'), lg: rem('60px') },
      }}
      navbar={{
        width: { base: rem('1vw'), sm: rem('80px') },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      layout={'alt'}
      padding="md"
      bg={'var(--mantine-color-dark-light)'}
    >
      <AppShell.Header>
        <Container size={'xl'} h={'100%'} px={'md'}>
          <Group justify={'space-between'}>
            <Group justify={'flex-start'} align={'center'}>
              <Burger mt={'md'} opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Box component="div" id={'app-header'} />
            </Group>
            <Group gap={'xs'} mt={'sm'} visibleFrom={'xs'}>
              <UserInfo />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Navbar>
        <Navbar
          close={() => {
            if (opened) {
              close();
            }
          }}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        <ErrorBoundary FallbackComponent={Error}>
          {demoMode && (
            <Container size={'xl'}>
              <Alert variant="light" title={t('demo_instance', 'Demo Instance')} icon={<IconInfoCircle />} mb="sm">
                <Text>
                  This is a demo instance which gets resets every hour. If you end up creating a trip that you would
                  want to keep, please export it for your record.
                </Text>
              </Alert>
            </Container>
          )}
          <Outlet />
        </ErrorBoundary>
      </AppShell.Main>
      <AppShell.Footer visibleFrom={'md'}>
        <Container size={'xl'}>
          <Group h={'xl'} justify={'flex-end'} px={'sm'}>
            <Anchor href={'https://surmai.app/documentation'} target={'_blank'}>
              {t('documentation', 'Documentation')}
            </Anchor>{' '}
            |
            <Anchor href={'https://surmai.app/documentation/about.html'} target={'_blank'}>
              {t('about_surmai', 'About Surmai')}
            </Anchor>
          </Group>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}

export default App;
