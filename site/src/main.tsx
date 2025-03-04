import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/carousel/styles.css';

import { Box, MantineProvider } from '@mantine/core';
import { Header } from './Header/Header.tsx';
import { Body } from './Body/Body.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider defaultColorScheme="auto">
    <Box>
      <Header />
      <Body />
    </Box>
  </MantineProvider>
);
