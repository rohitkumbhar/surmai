import { Card, Group, Switch, Text, Title } from '@mantine/core';
import classes from '../../pages/Settings/Settings.module.css';
import { areSignupsEnabled, disableUserSignups, enableUserSignups } from '../../lib';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

export const UsersSettings = () => {
  const [signupsEnabled, setSignupsEnabled] = useState<boolean>(true);
  useEffect(() => {
    areSignupsEnabled().then((result) => setSignupsEnabled(result));
  }, []);

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        Users
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        Manage site users
      </Text>

      <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl" key={'cities_dataset'}>
        <div>
          <Text>New User Signups</Text>
          <Text size="sm" c="dimmed">
            Allow users to sign up via the registration form
          </Text>
        </div>
        <Switch
          onLabel="ON"
          offLabel="OFF"
          className={classes.switch}
          size="lg"
          checked={signupsEnabled}
          onChange={(event) => {
            const enabled = event.currentTarget.checked;
            if (!enabled) {
              disableUserSignups().then(() => {
                setSignupsEnabled(false);
                notifications.show({
                  title: 'Settings updated',
                  message: 'User signups disabled',
                  position: 'top-right',
                });
              });
            } else {
              enableUserSignups().then(() => {
                setSignupsEnabled(true);
                notifications.show({
                  title: 'Settings updated',
                  message: 'User signups enabled',
                  position: 'top-right',
                });
              });
            }
          }}
        />
      </Group>
    </Card>
  );
};
