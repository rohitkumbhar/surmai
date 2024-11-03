import { ReactNode } from 'react';
import { Portal } from '@mantine/core';

export const Header = ({ children }: { children: ReactNode }) => {
  return <Portal target={'#app-header'}>{children}</Portal>;
};
