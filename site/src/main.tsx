import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { Container, MantineProvider, Text } from '@mantine/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider defaultColorScheme="auto">
    <Container>
      <Text>Hello Surmai Site</Text>
    </Container>
  </MantineProvider>
);
