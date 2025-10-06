import { Button, Group, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const InvitationForm = ({
  handleSubmit,
  onCancel,
}: {
  onCancel: () => void;
  handleSubmit: (email: string, message: string) => void;
}) => {
  const { t } = useTranslation();

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

  const onFormSubmit = (values: { email: string; message: string }) => {
    const { email, message } = values;
    handleSubmit(email, message);
  };

  return (
    <form onSubmit={form.onSubmit(onFormSubmit)}>
      <TextInput
        miw={'500px'}
        name={'email'}
        leftSection={<IconMail size={18} stroke={1.5} />}
        label={t('email_address', 'Email Address')}
        mt={'md'}
        required
        type={'email'}
        description={t('recipient_email_description', 'Email address for the recipient')}
        key={form.key('email')}
        {...form.getInputProps('email')}
      />

      <Textarea
        mt={'md'}
        required
        resize={'both'}
        name={'message'}
        label={t('invitation_message', 'Message')}
        description={t('invitation_message_description', 'A brief message with the invitation. 200 chars limit.')}
        placeholder=""
        key={form.key('message')}
        {...form.getInputProps('message')}
      />

      <Group mt={'md'} justify={'flex-end'}>
        <Button
          type={'button'}
          variant={'default'}
          onClick={() => {
            onCancel();
          }}
        >
          {t('cancel', 'Cancel')}
        </Button>
        <Button type={'submit'}>{t('send_invitation', 'Send Invitation')}</Button>
      </Group>
    </form>
  );
};
