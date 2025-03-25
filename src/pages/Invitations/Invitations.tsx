import { useTranslation } from 'react-i18next';
import { Header } from '../../components/nav/Header.tsx';
import { Anchor, Card, Container, Group, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Invitation } from '../../types/invitations.ts';
import { listInvitations } from '../../lib/api';
import { TripCollaborationInvitationCard } from '../../components/invitations/TripCollaborationInvitationCard.tsx';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';

export const Invitations = () => {
  const { data: invitations, refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: ['listInvitations'],
    queryFn: () => listInvitations(),
  });

  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t('invitations', 'Invitations'));

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('invitations', 'Invitations')}
        </Text>
      </Header>

      {invitations && invitations.length === 0 && (
        <Card>
          <Group>
            <Text>{t('no_pending_invitations', 'You do not have any pending invitations.')}</Text>
            <Anchor
              size="sm"
              component="button"
              type="button"
              onClick={() => {
                navigate('/');
              }}
            >
              <Text>{t('view_all_trips', 'View All Trips')}</Text>
            </Anchor>
          </Group>
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
