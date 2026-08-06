import { Image } from '@mantine/core';

function NavLogo() {
  return (
    <Image
      radius={99}
      h={80}
      w="auto"
      fit="contain"
      src="/icons/logo.svg"
    />
  );
}