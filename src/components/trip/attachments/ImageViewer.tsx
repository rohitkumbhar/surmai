import { Image } from '@mantine/core';

export const ImageViewer = ({
  imageUrl,
  imageName,
}: {
  imageUrl: string;
  imageName: string;
}) => {
  return (
    <Image
      src={imageUrl}
      alt={imageName}
      h={'auto'}
      w={'300'}
      radius={'md'}
      fit="cover"
    />
  );
};
