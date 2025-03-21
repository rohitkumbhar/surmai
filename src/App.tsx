import { Alert, AppShell, Box, Burger, Container, Group, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Navbar } from './components/nav/Navbar.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { Error } from './components/error/Error.tsx';
import { IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSurmaiContext } from './app/useSurmaiContext.ts';
import { UserInfo } from './components/user/UserInfo.tsx';
import { useDefaultPageTitle } from './lib/hooks/usePageTitle.ts';

function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const { demoMode } = useSurmaiContext();
  useDefaultPageTitle();
  const { t } = useTranslation();
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
            <Container>
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
    </AppShell>
  );
}

export default App;
