import { Burger, Container, Group, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import { FishOne } from '../../../src/components/logo/FishOne.tsx';

const links = [
  { link: 'https://demo.surmai.app/', label: 'Demo', target: '_blank' },
  { link: 'https://github.com/rohitkumbhar/surmai', label: 'Source Code', target: '_blank' },
];

export function Header() {
  const [opened, { toggle }] = useDisclosure(false);

  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      target={link.target || '_self'}
      className={classes.link}
      /*onClick={(event) => {
        event.preventDefault();
        setActive(link.link);
      }}*/
    >
      {link.label}
    </a>
  ));

  return (
    <header className={classes.header}>
      <Container size="lg" className={classes.inner}>
        {/*<MantineLogo size={28} />*/}
        <Group gap={'lg'}>
          <FishOne size={50} />
          <Title order={3}>Surmai</Title>
          <Text size={'sm'} c={'dimmed'}>
            Travel Planning Made Easy
          </Text>
        </Group>
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>

        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
}