import { Alert, Loader, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { TravellerProfileForm } from './TravellerProfileForm.tsx';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { getMyTravellerProfile, upsertMyTravellerProfile } from '../../lib/api/index.ts';

import type { NewTravellerProfile } from '../../types/trips.ts';

export const MyTravelProfile = () => {
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my_traveller_profile', currentUser?.email],
    queryFn: () => getMyTravellerProfile(currentUser!.email),
    enabled: !!currentUser?.email,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ data, files }: { data: Partial<NewTravellerProfile>; files: File[] }) => {
      return upsertMyTravellerProfile(currentUser!.email, currentUser!.id, data, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_traveller_profile', currentUser?.email] });
      notifications.show({
        title: t('success', 'Success'),
        message: t('travel_profile_saved', 'Travel profile saved successfully'),
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: t('error', 'Error'),
        message: error.message,
        color: 'red',
      });
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  if (!currentUser) {
    return <Alert color="red"><Text>{t('not_logged_in', 'You must be logged in.')}</Text></Alert>;
  }

  return (
    <TravellerProfileForm
      initialValues={profile ?? ({ email: currentUser.email, legalName: '' } as any)}
      onSubmit={(data, files) => upsertMutation.mutate({ data, files })}
      onCancel={() => {}}
      hideCancelButton
      hideEmail
      isOwner={!profile || profile.ownerId === currentUser.id}
    />
  );
};
