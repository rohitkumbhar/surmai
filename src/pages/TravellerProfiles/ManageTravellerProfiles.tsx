import { Container, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { Header } from '../../components/nav/Header.tsx';
import { TravellerProfileList } from '../../components/traveller/TravellerProfileList.tsx';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';

const ManageTravellerProfiles = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useCurrentUser();
  usePageTitle(t('manage_traveller_profiles', 'Traveler Profiles'));

  return (
    <Container size={'xl'} px={0} py={'sm'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('manage_traveller_profiles', 'Traveler Profiles')}
        </Text>
      </Header>
      <TravellerProfileList excludeEmail={currentUser?.email} />
    </Container>
  );
};

export default ManageTravellerProfiles;
