import { useDocumentTitle } from '@mantine/hooks';

export const usePageTitle = (pageTitle: string) => {
  useDocumentTitle(`Surmai | ${pageTitle}`);
};

export const useDefaultPageTitle = () => {
  useDocumentTitle(`Surmai`);
};
