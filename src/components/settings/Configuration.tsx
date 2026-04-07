import { LoadingOverlay, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { NewUserSignups } from './NewUserSignups.tsx';
import { OAuth2SettingsForm } from './OAuth2SettingsForm.tsx';
import { SmtpSettingsForm } from './SmtpSettingsForm.tsx';
import { getUsersMetadata } from '../../lib/api';

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
      {userModel && <OAuth2SettingsForm oauthConfig={userModel?.oauth2} refetch={refetch} />}
      <SmtpSettingsForm />
    </Stack>
  );
};
