import { AspectRatio, Avatar, Button, Group } from '@mantine/core';
import { getAttachmentUrl, updateUserAvatar } from '../../lib';
import { openContextModal } from '@mantine/modals';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';

export const UserAvatarForm = () => {
  const { user, reloadUser } = useCurrentUser();
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <Group mt={'sm'}>
      <AspectRatio ratio={400 / 400}>
        <Avatar
          name={user?.name}
          color={'initials'}
          src={user?.avatar && getAttachmentUrl(user, user.avatar)}
          size={100}
          radius="md"
        />
      </AspectRatio>

      {user && (
        <Button
          onClick={() => {
            openContextModal({
              modal: 'uploadImageForm',
              title: t('basic.add_cover_image', 'Add Cover Image'),
              radius: 'md',
              withCloseButton: false,
              size: 'auto',
              fullScreen: isMobile,
              innerProps: {
                aspectRatio: 400 / 400,
                saveUploadedImage: (uploadedImage: File | Blob) => {
                  updateUserAvatar(user.id, uploadedImage).then(() => {
                    reloadUser && reloadUser();
                  });
                },
              },
            });
          }}
        >
          {t('change_avatar', 'Change Avatar')}
        </Button>
      )}
    </Group>
  );
};
