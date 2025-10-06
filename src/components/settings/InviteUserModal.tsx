import { ActionIcon, Alert, Code, Container, CopyButton, Group, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconCopy, IconMacroOff } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSurmaiContext } from '../../app/useSurmaiContext.ts';
import { sendUserAccountInvitation } from '../../lib/api';
import { InvitationForm } from '../invitations/InvitationForm.tsx';

import type { ContextModalProps } from '@mantine/modals';

export const InviteUserModal = ({ context, id }: ContextModalProps) => {
  const { t } = useTranslation();
  const { emailEnabled } = useSurmaiContext();
  const [showAlert, { close: closeAlert }] = useDisclosure(!emailEnabled);
  const [invitationCode, setInvitationCode] = useState<string>();
  const sendAccountInvitation = (email: string, message: string) => {
    sendUserAccountInvitation(email, message).then((result) => {
      setInvitationCode(result.invitationCode);
      closeAlert();
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
            {t('account_invitation_email_is_not_enabled', 'Sending emails has not been enabled on this server.')}
          </Text>
          <Text size={'sm'}>
            {t('share_invitation_link', 'Please share the generated invitation link with the recipient.')}
          </Text>
        </Alert>
      )}
      {!invitationCode && (
        <InvitationForm
          onCancel={function (): void {
            context.closeModal(id);
          }}
          handleSubmit={sendAccountInvitation}
        />
      )}
      {invitationCode && (
        <>
          <Title order={5}>{t('invitation_code_url_pre', 'Invitation link')}</Title>
          <Group mt={'sm'}>
            <Code>{`${window.origin}/register?code=${invitationCode}`}</Code>
            <CopyButton value={`${window.origin}/register?code=${invitationCode}`} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </>
      )}
    </Container>
  );
};
