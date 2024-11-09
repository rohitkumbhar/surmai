import {
  Avatar,
  Button,
  Card,
  Container,
  Notification,
  Paper,
  Text,
  TextInput,
} from '@mantine/core';
import classes from './UserProfile.module.css';
import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { User } from '../../types/auth.ts';
import { currentUser } from '../../lib';

export const UserProfile = () => {
  const [user, setCurrentUser] = useState<User>();
  const [editing, setEditing] = useState(false);
  const [apiError, setApiError] = useState<string>();

  useEffect(() => {
    currentUser().then((resolvedUser) => setCurrentUser(resolvedUser));
  }, []);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: user?.name,
      profilePicture: '',
    },
  });

  if (!editing) {
    return (
      <Card

        padding="xl"
        radius="md"
        className={classes.card}
        w={300}
        m={'auto'}
      >
        <Card.Section
          h={140}
          className={classes.headerSection}
          // style={{
          //   backgroundImage:
          //     'url(https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80)',
          // }}
        />

        <Avatar
          src={user?.prefs?.profilePictureUrl}
          name={user?.name}
          size={80}
          radius={80}
          mx="auto"
          mt={-30}
          className={classes.avatar}
        />
        <Text ta="center" fz="lg" fw={500} mt="sm">
          {user?.name}
        </Text>
        <Text ta="center" fz="sm" c="dimmed">
          {user?.email}
        </Text>

        <Button
          fullWidth
          radius="md"
          mt="xl"
          size="md"
          variant="default"
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
      </Card>
    );
  } else {
    // @ts-expect-error WIP: Declare Form type
    const updateProfile = (values) => {
      console.log('Updating user profile with values =>', values);
    };

    return (
      <Container size={420} my={40}>
        <Paper
          withBorder
          shadow="md"
          p={30}
          mt={30}
          radius="md"
          bg="var(--mantine-primary-color-light)"
        >
          {apiError && (
            <Notification
              withBorder
              color="red"
              title="Unable to sign in"
              onClose={() => setApiError(undefined)}
            >
              {apiError}
            </Notification>
          )}

          <form onSubmit={form.onSubmit((values) => updateProfile(values))}>
            <TextInput
              label="Name"
              placeholder="Name"
              mt={'md'}
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />

            <div
              style={{
                marginTop: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ backgroundColor: 'pink', margin: 'auto' }}>
                <Button type={'submit'}>Update</Button>
              </div>

              <div style={{ margin: 'auto' }}>
                <Button
                  type={'button'}
                  bg={'gray'}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Paper>
      </Container>
    );
  }
};
