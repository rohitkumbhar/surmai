import { ContextModalProps } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { Alert, Button, Container, Group, Text, Textarea, TextInput } from '@mantine/core';
import { sendCollaborationInvitation } from '../../../lib/api';
import { IconMacroOff, IconMail } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { useDisclosure } from '@mantine/hooks';
import { showErrorNotification, showSaveSuccessNotification } from '../../../lib/notifications.tsx';

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

  const form = useForm<{ email: string; message: string }>({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      message: '',
    },
    validate: {
      message: (value) => {
        if (value && value.length > 200) {
          return t(
            'keep_it_brief',
            'Please limit the message to 200 characters or less. Currently at {{ curVal }} characters.',
            {
              curVal: value.length,
            }
          );
        }
        return null;
      },
    },
  });

  const handleSubmit = (values: { email: string; message: string }) => {
    const { email, message } = values;
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
              'email_is_not_enabled',
              'Sending emails has not been enabled on this server. The recipient will not receive a notification email. They will see the invitation when they log into their account.'
            )}
          </Text>
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          miw={'500px'}
          name={'email'}
          leftSection={<IconMail size={18} stroke={1.5} />}
          label={t('basic.email_address', 'Email Address')}
          mt={'md'}
          required
          type={'email'}
          description={t('basic.recipient_email_description', 'Email address for the recipient')}
          key={form.key('email')}
          {...form.getInputProps('email')}
        />

        <Textarea
          mt={'md'}
          required
          resize={'both'}
          name={'message'}
          label={t('basic.invitation_message', 'Message')}
          description={t(
            'basic.invitation_message_description',
            'A brief message with the invitation. 200 chars limit.'
          )}
          placeholder=""
          key={form.key('message')}
          {...form.getInputProps('message')}
        />

        <Group mt={'md'} justify={'flex-end'}>
          <Button
            type={'button'}
            variant={'default'}
            onClick={() => {
              context.closeModal(id);
            }}
          >
            {t('cancel', 'Cancel')}
          </Button>
          <Button type={'submit'}>{t('invite', 'Send Invitation')}</Button>
        </Group>
      </form>
    </Container>
  );
};
