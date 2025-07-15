import { createTheme } from '@mantine/core';

const availableColors: { [key: string]: string[] } = {
  shrimp: [
    '#f7f3f3',
    '#e6e4e4',
    '#cfc6c6',
    '#b9a5a5',
    '#a58988',
    '#9b7776',
    '#966d6d',
    '#835d5d',
    '#765252',
    '#694545',
  ],
  blueGray: [
    '#f2f4f7',
    '#e4e5e8',
    '#c5c9d2',
    '#a3abbc',
    '#8792a9',
    '#75829e',
    '#6b7a99',
    '#5b6886',
    '#4f5c78',
    '#41506c',
  ],
  pnw: ['#f3f6f5', '#e8e9e9', '#cdd2cf', '#afbab3', '#95a69c', '#849a8c', '#7b9484', '#688071', '#5b7264', '#4a6354'],
  sahara: [
    '#fff1e7',
    '#f7e3d7',
    '#e9c5b2',
    '#daa689',
    '#cf8b66',
    '#c87a50',
    '#c57143',
    '#ae5f35',
    '#9c542d',
    '#894622',
  ],
  caribbean: [
    '#e3fdfc',
    '#d5f5f4',
    '#b0e9e6',
    '#88dcd8',
    '#66d1cb',
    '#50cac4',
    '#41c7c0',
    '#2eb0a9',
    '#1d9d97',
    '#008883',
  ],
  potato: [
    '#f7f3f2',
    '#e8e6e5',
    '#d2c9c6',
    '#bdaaa4',
    '#ab9087',
    '#a17f74',
    '#9d766a',
    '#896459',
    '#7b594e',
    '#6d4b40',
  ],
};
export const buildTheme = (primaryColor: string) => {
  const theme = createTheme({
    fontFamily: 'Verdana, sans-serif',
    // @ts-expect-error type not exposed
    colors: availableColors,
    primaryColor: availableColors[primaryColor] ? primaryColor : 'blueGray',
  });

  return theme;
};
