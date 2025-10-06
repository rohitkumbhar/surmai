import { AspectRatio, Avatar, Button, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { openContextModal } from '@mantine/modals';
import { IconUserHexagon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { getAttachmentUrl, updateUserAvatar } from '../../lib/api';

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
          size={isMobile ? 200 : 300}
          radius="md"
        />
      </AspectRatio>

      {user && (
        <Button
          leftSection={<IconUserHexagon />}
          onClick={() => {
            openContextModal({
              modal: 'uploadImageForm',
              title: t('user_change_avatar', 'Update User Avatar'),
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
