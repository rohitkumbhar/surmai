import { AspectRatio, Avatar, Button, Stack } from '@mantine/core';
import { getAttachmentUrl, updateUserAvatar } from '../../lib/api';
import { openContextModal } from '@mantine/modals';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { IconUserHexagon } from '@tabler/icons-react';

export const UserAvatarForm = () => {
  const { user, reloadUser } = useCurrentUser();
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <Stack mt={'lg'} align={'center'}>
      <AspectRatio ratio={400 / 400}>
        <Avatar
          name={user?.name}
          color={'initials'}
          src={user?.avatar && getAttachmentUrl(user, user.avatar)}
          size={300}
          radius="md"
        />
      </AspectRatio>

      {user && (
        <Button
          leftSection={<IconUserHexagon />}
          onClick={() => {
            openContextModal({
              modal: 'uploadImageForm',
              title: t('trip_add_cover_image', 'Add Cover Image'),
              radius: 'md',
              withCloseButton: false,
              size: 'auto',
              fullScreen: isMobile,
              innerProps: {
                aspectRatio: 400 / 400,
                saveUploadedImage: (uploadedImage: File | Blob) => {
                  updateUserAvatar(user.id, uploadedImage).then(() => {
                    if (reloadUser) {
                      reloadUser();
                    }
                  });
                },
              },
            });
          }}
        >
          {t('change_avatar', 'Change Avatar')}
        </Button>
      )}
    </Stack>
  );
};
