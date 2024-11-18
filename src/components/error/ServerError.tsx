import { Button, Container, Group, Text, Title } from '@mantine/core';
import classes from './ServerError.module.css';

export function ServerError() {
  return (
    <div className={classes.root}>
      <Container>
        <div className={classes.label}>500</div>
        <Title className={classes.title}>Something bad just happened...</Title>
        <Text size="md" ta="center" className={classes.description}>
          An error has been logged to the browser's console.
        </Text>
        <Group justify="center">
          <Button variant="white" size="md">
            Refresh the page
          </Button>
        </Group>
      </Container>
    </div>
  );
}
