import {
  Alert,
  Anchor,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  Notification,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import classes from './SignIn.module.css';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { authWithUsernameAndPassword, listAuthMethods, sendResetPasswordRequest, startOAuthFlow } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { showErrorNotification, showInfoNotification } from '../../lib/notifications.tsx';
import { useSurmaiContext } from '../../app/useSurmaiContext.ts';
import { useDefaultPageTitle } from '../../lib/hooks/usePageTitle.ts';

export const SignIn = () => {
  useDefaultPageTitle();
  const { signupsEnabled, demoMode } = useSurmaiContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<string>();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [resetEmailAddress, setResetEmailAddress] = useState<string | undefined>();
  const [oauthInfo, setOAuthInfo] = useState<{ name: string; displayName: string } | undefined>();
  const [forgotPasswordFormOpened, { open: openForgotPasswordForm, close: closeForgotPasswordForm }] =
    useDisclosure(false);

  const signInWithEmailAndPassword = (values: { email: string; password: string }) => {
    authWithUsernameAndPassword({
      email: values.email,
      password: values.password,
    })
      .then(() => {
        setApiError(undefined);
        navigate('/');
      })
      .catch((err) => {
        setApiError(err.message);
      });
  };

  useEffect(() => {
    listAuthMethods().then((result) => {
      if (result.oauth2.enabled && result.oauth2.providers.length > 0) {
        setOAuthInfo(result.oauth2.providers[0]);
      }
    });
  }, []);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        return /^\S+@\S+$/.test(value) ? null : t('error_invalid_email', 'Invalid email address');
      },
    },
  });

  return (
    <div className={classes.wrapper}>
      <Modal
        opened={forgotPasswordFormOpened}
        fullScreen={isMobile}
        size="lg"
        title={t('reset_password', 'Reset Password')}
        onClose={() => {
          closeForgotPasswordForm();
        }}
      >
        <Container>
          <Text>
            {t(
              'reset_password_action_description',
              'Enter the email address associated with your account. If an account exists, password reset instructions will be emailed to this address.'
            )}
          </Text>

          <TextInput
            name={'resetEmailAddress'}
            label={t('reset_email_address', 'Email Address')}
            placeholder="you@domain.com"
            mt={'md'}
            onChange={(event) => setResetEmailAddress(event.target.value)}
            required
          />

          <Button
            fullWidth
            mt="xl"
            type={'button'}
            name={'sendResetInstructions'}
            disabled={!resetEmailAddress}
            onClick={() => {
              if (resetEmailAddress) {
                const validEmail = /^\S+@\S+$/.test(resetEmailAddress);
                if (validEmail) {
                  sendResetPasswordRequest(resetEmailAddress)
                    .then(() => {
                      closeForgotPasswordForm();
                      return showInfoNotification({
                        title: t('reset_password', 'Reset Password'),
                        message: t('reset_request_submitted', 'Your password reset request has been submitted.'),
                      });
                    })
                    .catch((error) => {
                      showErrorNotification({
                        error,
                        title: t('reset_password', 'Reset Password'),
                        message: t(
                          'reset_request_not_submitted',
                          'Your password reset request could not be submitted.'
                        ),
                      });
                    });
                }
              }
            }}
          >
            {t('send_reset_inst', 'Reset Password')}
          </Button>
        </Container>
      </Modal>
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md" bg="var(--mantine-primary-color-light)">
          <Text size="lg" ta="center" mt={5}>
            {t('welcome_to_surmai', 'Welcome to Surmai')}
          </Text>
          {oauthInfo && (
            <>
              <Group grow mb="md" mt="md">
                <Button
                  onClick={() => {
                    startOAuthFlow(oauthInfo.name).then(() => {
                      navigate('/');
                    });
                  }}
                >
                  Sign in with {oauthInfo.displayName}
                </Button>
              </Group>
              <Divider label={t('or_use_email_login', 'Or continue with email')} labelPosition="center" my="lg" />
            </>
          )}

          {apiError && (
            <Notification withBorder color="red" title="Unable to sign in" onClose={() => setApiError(undefined)}>
              {apiError}
            </Notification>
          )}

          <form onSubmit={form.onSubmit((values) => signInWithEmailAndPassword(values))}>
            <TextInput
              name={'email'}
              label={t('email_address', 'Email Address')}
              placeholder="you@domain.com"
              mt={'md'}
              required
              key={form.key('email')}
              {...form.getInputProps('email')}
            />

            <PasswordInput
              name={'password'}
              label={t('password', 'Password')}
              required
              mt="md"
              key={form.key('password')}
              {...form.getInputProps('password')}
            />
            <Anchor
              size="sm"
              component="button"
              type="button"
              onClick={() => {
                openForgotPasswordForm();
              }}
            >
              <Text>{t('forgot_password', 'Forgot Password')}</Text>
            </Anchor>

            <Button fullWidth mt="xl" type={'submit'} name={'loginBtn'}>
              {t('sign_in', 'Sign In')}
            </Button>

            {signupsEnabled && (
              <Text c="dimmed" size="sm" ta="center" mt={25}>
                {t('no_account', 'Do not have an account yet?')}{' '}
                <Anchor
                  size="sm"
                  component="button"
                  type="button"
                  onClick={() => {
                    navigate('/register');
                  }}
                >
                  <Text>{t('create_account', 'Create An Account')}</Text>
                </Anchor>
              </Text>
            )}

            {demoMode && (
              <Stack mt={'md'} gap={0}>
                <Alert>
                  <Text size={'sm'}>Demo User: demo@surmai.app</Text>
                  <Text size={'sm'}>Demo Password: vi#c8Euuf16idhbG</Text>
                </Alert>
              </Stack>
            )}
          </form>
        </Paper>
      </Container>
    </div>
  );
};
