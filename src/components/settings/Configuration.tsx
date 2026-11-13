import { LoadingOverlay, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { NewUserSignups } from '@src/components/settings/NewUserSignups.tsx';
import { OAuth2SettingsForm } from '@src/components/settings/OAuth2SettingsForm.tsx';
import { PasswordAuthLogin } from '@src/components/settings/PasswordAuthLogin.tsx';
import { SmtpSettingsForm } from '@src/components/settings/SmtpSettingsForm.tsx';
import { getUsersMetadata } from '@src/lib/api';

export const Configuration = () => {
  const {
    isPending,
    data: userModel,
    refetch,
  } = useQuery({
    queryKey: ['getUsersMetadata'],
    queryFn: () => getUsersMetadata(),
  });

  return (
    <Stack mt={'md'}>
      <div style={{ width: '100%', position: 'relative' }}>
        <LoadingOverlay
          visible={isPending}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ type: 'bars' }}
        />
      </div>
      <NewUserSignups userModel={userModel} refetch={refetch} />
      <PasswordAuthLogin userModel={userModel} refetch={refetch} />
      {userModel && <OAuth2SettingsForm oauthConfig={userModel?.oauth2} refetch={refetch} />}
      <SmtpSettingsForm />
    </Stack>
  );
};
