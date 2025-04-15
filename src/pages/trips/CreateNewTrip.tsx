import { Accordion, Button, Container, Group, rem, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoSquare } from '@tabler/icons-react';
import { createTrip } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { CreateTripForm, NewTrip } from '../../types/trips.ts';
import { EditTripBasicForm } from '../../components/trip/basic/EditTripBasicForm.tsx';
import { basicInfoFormValidation } from '../../components/trip/basic/validation.ts';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/nav/Header.tsx';
import { useState } from 'react';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { showErrorNotification } from '../../lib/notifications.tsx';

export const CreateNewTrip = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [creatingTrip, setCreatingTrip] = useState<boolean>(false);
  const { user } = useCurrentUser();

  const form = useForm<CreateTripForm>({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      description: undefined,
      dateRange: [null, null],
      destinations: [],
      participants: [],
    },
    validate: basicInfoFormValidation,
  });

  return (
    <Container py="xl">
      <Header>
        <Text size="md" p={'sm'}>
          {t('trip_new', 'Start A New Trip')}
        </Text>
      </Header>

      <form
        onSubmit={form.onSubmit(async (values) => {
          setCreatingTrip(true);
          const { name, description, dateRange, participants, destinations } = values;
          const data: NewTrip = {
            name: name,
            description: description,
            startDate: dateRange[0] || new Date(),
            endDate: dateRange[1] || new Date(),
            ownerId: user?.id || '',
            participants: participants?.map((p) => {
              return { name: p };
            }),
            destinations: destinations?.map((d) => {
              return {
                id: d.id,
                name: d.name,
                stateName: d.stateName,
                countryName: d.countryName,
                latitude: d.latitude,
                longitude: d.longitude,
                timezone: d.timezone,
              };
            }),
          };

          createTrip(data)
            .then((trip) => {
              navigate(`/trips/${trip.id}`);
            })
            .catch((err) => {
              showErrorNotification({
                error: err,
                title: t('trip_failed', 'Error'),
                message: t('trip_failed_details', 'Unable to create trip'),
              });
            })
            .finally(() => {
              setCreatingTrip(false);
            });
        })}
      >
        <Accordion chevronPosition="right" variant="contained" value="basic_info">
          <Accordion.Item value={'basic_info'} key={'basic_info'}>
            <Accordion.Control
              icon={
                <IconInfoSquare
                  style={{
                    color: 'var(--mantine-primary-color-6',
                    width: rem(40),
                    height: rem(40),
                  }}
                />
              }
            >
              <Group wrap="nowrap">
                <div>
                  <Text>{t('trip_basic_information', 'Basic Information')}</Text>
                  <Text size="sm" c="dimmed" fw={400}>
                    {t('add_basic_info_to_start', 'Enter some basic information about your trip to get started')}
                  </Text>
                </div>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <EditTripBasicForm form={form} />
              <Group mt="xl" justify={'flex-end'}>
                <Button disabled={!form.isValid()} loading={creatingTrip} type={'submit'}>
                  {t('create_trip', 'Create Trip')}
                </Button>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </form>
    </Container>
  );
};
