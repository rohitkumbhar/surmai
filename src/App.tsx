import { AppShell, Box, Burger, Container, Group, rem } from '@mantine/core';
import { useDisclosure, useDocumentTitle } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Navbar } from './components/nav/Navbar.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { Error } from './components/error/Error.tsx';

function App() {
  const [opened, { toggle, close }] = useDisclosure();
  useDocumentTitle('Surmai');
  return (
    <AppShell
      header={{
        height: { base: rem('60px'), md: rem('60px'), lg: rem('60px') },
      }}
      navbar={{
        width: { base: rem('80px') },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      layout={'alt'}
      padding="md"
      bg={'var(--mantine-color-dark-light)'}
    >
      <AppShell.Header>
        <Container size={'xl'} h={'100%'}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group>
            <Box component="div" id={'app-header'} />
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
          <Outlet />
        </ErrorBoundary>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
