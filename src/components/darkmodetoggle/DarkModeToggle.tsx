import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const DarkModeToggle = () => {
  const { t } = useTranslation();
  const { setColorScheme, colorScheme } = useMantineColorScheme()

  let isDarkMode: boolean = false;
  if (colorScheme == 'auto') {
    if (window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDarkMode = true;
      } else {
        isDarkMode = false;
      }
    }
  } else if (colorScheme == "dark") {
    isDarkMode = true;
  } else {
    isDarkMode = false;
  }
  const toggleIcon = isDarkMode ?
    <IconSun style={{ width: '70%', height: '70%' }} stroke={1.5} /> :
    <IconMoon style={{ width: '70%', height: '70%' }} stroke={1.5} />

  return (
    <ActionIcon
      variant="default"
      aria-label={t('dark_mode_toggle', 'Dark Mode Toggle')}
      onClick={() => setColorScheme(isDarkMode ? 'light' : 'dark')}
    >
      {toggleIcon}
    </ActionIcon>
  );
};
