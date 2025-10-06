import { Portal } from '@mantine/core';

import type { ReactNode } from 'react';

export const Header = ({ children }: { children: ReactNode }) => {
  return <Portal target={'#app-header'}>{children}</Portal>;
};
