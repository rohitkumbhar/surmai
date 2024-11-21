import { Button, Card, Group, Text, Title } from '@mantine/core';
import classes from '../../pages/Settings/Settings.module.css';
import { useEffect, useState } from 'react';
import { countAirports, countCities, loadCities } from '../../lib';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

export const Datasets = () => {
  const [cityCount, setCityCount] = useState<number | undefined>();
  const [airportCount, setAirportCount] = useState<number | undefined>();

  useEffect(() => {
    countCities().then((count) => setCityCount(count));
    countAirports().then((count) => setAirportCount(count));
  }, []);

  const cityLoadConfirmationModal = () =>
    modals.openConfirmModal({
      title: 'Loading Cities Dataset',
      children: (
        <Text size="sm">
          This action will load approximately 150000 cities into your database and will take a long time.
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => console.log('Cancel'),
      onConfirm: () => {
        loadCities().then((results) => {
          console.log('result', results);
          notifications.show({
            title: 'City Dataset Loaded',
            message: `Number of cities loaded: ${results.count}`,
            position: 'top-right',
          });
        });
      },
    });

  return (
    <Card withBorder radius="md" p="xl">
      <Title order={3} fw={500}>
        Configure Data
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        Load available datasets
      </Text>

      <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl" key={'cities_dataset'}>
        <div>
          <Text>World Cities</Text>
          <Text size="sm" c="dimmed">
            A list of possible destinations. This list requires a manual loading action since it may take a long time to
            load.
          </Text>
          <Text size="sm" c="dimmed">
            Currently loaded cities: {cityCount || 0}
          </Text>
        </div>
        <Button onClick={cityLoadConfirmationModal}>Load Cities</Button>
      </Group>

      <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl" key={'airports_dataset'}>
        <div>
          <Text>World Airports</Text>
          <Text size="sm" c="dimmed">
            A list of medium and large airports around the world. This list is automatically loaded on setup.
          </Text>
          <Text size="sm" c="dimmed">
            Currently loaded airports: {airportCount || 0}
          </Text>
        </div>
      </Group>
    </Card>
  );
};
