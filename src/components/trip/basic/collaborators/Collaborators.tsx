import { Alert, Container, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMacroOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useSurmaiContext } from '../../../../app/useSurmaiContext.ts';
import { sendCollaborationInvitation } from '../../../../lib/api';
import { showErrorNotification, showSaveSuccessNotification } from '../../../../lib/notifications.tsx';
import { InvitationForm } from '../../../invitations/InvitationForm.tsx';

import type { Trip } from '../../../../types/trips.ts';
import type { ContextModalProps } from '@mantine/modals';

export const Collaborators = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  trip: Trip;
  onSave: () => void;
}>) => {
  const { trip } = innerProps;
  const { t } = useTranslation();
  const { emailEnabled } = useSurmaiContext();
  const [showAlert, { close: closeAlert }] = useDisclosure(!emailEnabled);

  const handleSubmit = (email: string, message: string) => {
    sendCollaborationInvitation(email, message, trip.id)
      .then(() => {
        showSaveSuccessNotification({
          title: t('invite_collaborator', 'Invite Collaborator'),
          message: t('collaborator_invitation_success', 'Invitation sent to {{email}}', { email: email }),
        });
      })
      .catch((error) => {
        showErrorNotification({
          title: t('invite_collaborator', 'Invite Collaborator'),
          message: t('collaborator_invitation_failed', 'Invitation could not be sent to {{email}}', { email: email }),
          error,
        });
      })
      .finally(() => {
        context.closeModal(id);
      });
  };

  return (
    <Container p={'xs'}>
      {showAlert && (
        <Alert
          variant="light"
          title={t('email_setup', 'Email Setup')}
          icon={<IconMacroOff size={18} />}
          mb="sm"
          onClose={closeAlert}
          withCloseButton
          closeButtonLabel={t('dismiss', 'Dismiss')}
        >
          <Text size={'sm'}>
            {t(
              'collaborator_invitation_email_is_not_enabled',
              'Sending emails has not been enabled on this server. The recipient will not receive a notification email. They will see the invitation when they log into their account.'
            )}
          </Text>
        </Alert>
      )}
      <InvitationForm
        onCancel={() => {
          context.closeModal(id);
        }}
        handleSubmit={handleSubmit}
      />
    </Container>
  );
};
