import { IconMail } from '@tabler/icons-react';
import { Blockquote, Button, Card, Group, Text } from '@mantine/core';
import { Invitation } from '../../types/invitations.ts';
import { useTranslation } from 'react-i18next';
import classes from './TripCollaborationInvitationCard.module.css';
import { invitationAction } from '../../lib/api';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';

export const TripCollaborationInvitationCard = ({
  invitation,
  onUpdate,
}: {
  invitation: Invitation;
  onUpdate: () => void;
}) => {
  const { t } = useTranslation();
  const trip = invitation.metadata.trip;
  const sender = invitation.metadata.sender;

  const updateInvitation = (accept: boolean) => {
    invitationAction({ invitationId: invitation.id, accept: accept }).then(() => {
      showSaveSuccessNotification({
        title: t('invitations', 'Invitations'),
        message: t('invitation_updated', 'Invitation updated'),
      });

      onUpdate();
    });
  };

  return (
    <Card withBorder radius="md" p="md" className={classes.card} maw={'400px'}>
      <Card.Section className={classes.section} mt="xs">
        <Group justify="apart">
          <Text fz="lg" fw={500} truncate={'end'}>
            {trip.name}
          </Text>
        </Group>
        <Text fz="sm" mt="xs" lineClamp={4} mah={90} mih={90}>
          {trip.description}
        </Text>
      </Card.Section>

      <Card.Section className={classes.section} mah={255} mih={255}>
        <Blockquote cite={sender.name} icon={<IconMail />} mt="sm">
          {invitation.message}
        </Blockquote>
      </Card.Section>

      <Group mt="xs">
        <Button
          radius="md"
          c={'green'}
          variant={'subtle'}
          style={{ flex: 1 }}
          onClick={() => {
            updateInvitation(true);
          }}
        >
          {t('accept', 'Accept')}
        </Button>
        <Button
          radius="md"
          c={'red'}
          variant={'subtle'}
          style={{ flex: 1 }}
          onClick={() => {
            updateInvitation(false);
          }}
        >
          {t('reject', 'Reject')}
        </Button>
      </Group>
    </Card>
  );
};
