import { Alert, Button, Container, Paper, Text, TextInput } from '@mantine/core';
import { useForm, UseFormReturnType } from '@mantine/form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithPassword } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { FancyPasswordInput } from '../../components/account/FancyPasswordInput.tsx';
import { SignUpForm } from '../../types/auth.ts';
import { useSurmaiContext } from '../../app/useSurmaiContext.ts';

export const SignUp = () => {
  const [apiError, setApiError] = useState<string>();
  const navigate = useNavigate();
  const { signupsEnabled } = useSurmaiContext();

  const { t } = useTranslation();
  const createAccount = async (values: {
    email: string;
    fullName: string;
    password: string;
    confirmPassword?: string;
  }) => {
    const { email, password, fullName } = values;
    createUserWithPassword({
      email,
      name: fullName,
      password,
      passwordConfirm: password || '',
    })
      .then(() => {
        navigate('/login');
      })
      .catch((err) => {
        setApiError(err);
      });
  };

  const form = useForm<SignUpForm>({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      fullName: '',
      password: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : t('account.invalid_email', 'Invalid email')),
    },
  });

  return (
    <>
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md" bg="var(--mantine-primary-color-light)">
          <Text size="lg" ta="center" mt={5}>
            {t('create_account', 'Create An Account')}
          </Text>

          {!signupsEnabled && (
            <Alert mt={'sm'} title={t('signups_disabled', 'Signups are disabled for this instance')}></Alert>
          )}

          {apiError && (
            <Alert
              withCloseButton
              closeButtonLabel={'Dismiss'}
              title={t('account_creation_failed', 'Unable to create an account')}
              onClose={() => setApiError(undefined)}
            >
              {apiError}
            </Alert>
          )}

          <form onSubmit={form.onSubmit((values) => createAccount(values))}>
            <TextInput
              label={t('name', 'Name')}
              placeholder={''}
              mt={'md'}
              required
              key={form.key('fullName')}
              {...form.getInputProps('fullName')}
            />
            <TextInput
              label={t('email', 'Email')}
              placeholder={'you@domain.com'}
              mt={'md'}
              required
              key={form.key('email')}
              {...form.getInputProps('email')}
            />

            {<FancyPasswordInput fieldName={'password'} form={form as UseFormReturnType<unknown>} />}

            <Button fullWidth mt="xl" type={'submit'} disabled={!signupsEnabled}>
              {t('create_account', 'Create An Account')}
            </Button>
          </form>
        </Paper>
      </Container>
    </>
  );
};
