import {
  Avatar,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Header } from '../../components/nav/Header.tsx';
import { useTranslation } from 'react-i18next';
import { openContextModal } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import { getAttachmentUrl, updateUserAvatar } from '../../lib';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';

export const Settings = () => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const { user, reloadUser } = useCurrentUser();

  return (
    <Container>
      <Header>
        <Text p={10}>Settings</Text>
      </Header>
      <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'}>
        <Title order={2}>Profile</Title>

        <Stack>
          <Group wrap="nowrap" mt={'sm'}>
            <Avatar
              name={user?.name}
              color={'initials'}
              src={user?.avatar && getAttachmentUrl(user, user.avatar)}
              size={200}
              radius="md"
            />
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
                Change Avatar
              </Button>
            )}
          </Group>
          <TextInput
            name={'name'}
            label={t('change_name', 'Name')}
            required
            value={user?.name}
            // key={form.key('origin')}
            // {...form.getInputProps('origin')}
          />

          <Group wrap="nowrap" gap={10} mt={3}></Group>
        </Stack>
      </Paper>
    </Container>
  );
};
