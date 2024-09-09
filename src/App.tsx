import {AppShell, Burger, Group, rem} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {Outlet} from "react-router-dom";
import {Navbar} from "./components/nav/Navbar.tsx";

function App() {
  const [opened, {toggle}] = useDisclosure();
  return (
    <AppShell
      header={{height: {base: rem('60px'), md: rem('60px'), lg: rem('60px')}}}
      navbar={{
        width: {base: rem('80px')},
        breakpoint: 'sm',
        collapsed: {mobile: !opened},
      }}
      layout={'alt'}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm"/>
          <div id={"app-header"} />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm"/>
        <Navbar/>
      </AppShell.Navbar>
      <AppShell.Main><Outlet/></AppShell.Main>
    </AppShell>
  );
}

export default (App)
