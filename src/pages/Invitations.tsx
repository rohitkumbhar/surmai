import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { Header } from '../components/nav/Header.tsx';
import { Card, Container, Group, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Invitation } from '../types/invitations.ts';
import { listInvitations } from '../lib/api';
import { TripCollaborationInvitationCard } from '../components/invitations/TripCollaborationInvitationCard.tsx';

export const Invitations = () => {
  const { data: invitations, refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: ['listInvitations'],
    queryFn: () => listInvitations(),
  });

  const { t } = useTranslation();
  useDocumentTitle(t('invitations', 'Invitations'));

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('invitations', 'Invitations')}
        </Text>
      </Header>

      {invitations && invitations.length === 0 && (
        <Card>
          <Text>{t('no_pending_invitations', 'You do not have any pending invitations')}</Text>
        </Card>
      )}
      <Group align={'top'}>
        {invitations?.map((invitation) => {
          return <TripCollaborationInvitationCard invitation={invitation} onUpdate={refetchInvitations} />;
        })}
      </Group>
    </Container>
  );
};
