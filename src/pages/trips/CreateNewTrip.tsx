import { Accordion, Button, Container, FileButton, Group, rem, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoSquare } from '@tabler/icons-react';
import { createTrip, importTripData } from '../../lib';
import { useNavigate } from 'react-router-dom';
import { CreateTripForm, NewTrip } from '../../types/trips.ts';
import { EditTripBasicForm } from '../../components/trip/basic/EditTripBasicForm.tsx';
import { basicInfoFormValidation } from '../../components/trip/basic/validation.ts';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/nav/Header.tsx';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';

export const CreateNewTrip = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tripDataFile, setTripDataFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
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

  useEffect(() => {
    if (tripDataFile) {
      setImporting(true);
      importTripData(tripDataFile)
        .then((res) => {
          navigate(`/trips/${res.tripId}`);
        })
        .catch((err) => {
          notifications.show({
            title: 'Import failed',
            message: `Import failed:${err.message}`,
            position: 'top-right',
          });
        })
        .finally(() => {
          setImporting(false);
        });
    }
  }, [tripDataFile]);

  return (
    <Container py="xl">
      <Header>
        <Text size="md" p={'sm'}>
          {t('trip.new', 'Start A New Trip')}
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
              };
            }),
          };

          createTrip(data)
            .then((trip) => {
              navigate(`/trips/${trip.id}`);
            })
            .catch((err) => {
              notifications.show({
                title: 'Unable to create trip',
                message: `Error: ${err.message}`,
                position: 'top-right',
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
                  <Text>{'Basic Information'}</Text>
                  <Text size="sm" c="dimmed" fw={400}>
                    {'Enter some basic information about your trip to get started'}
                  </Text>
                </div>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <EditTripBasicForm form={form} />
              <Group mt="xl" justify={'flex-end'}>
                <FileButton onChange={setTripDataFile} accept="application/json" form={'tripData'} name={'tripData'}>
                  {(props) => {
                    return (
                      <Button {...props} loading={importing} variant={'subtle'}>
                        {t('import_trip', 'Import Trip')}
                      </Button>
                    );
                  }}
                </FileButton>
                <Button disabled={importing && !form.isValid()} loading={creatingTrip} type={'submit'}>
                  Create Trip
                </Button>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </form>
    </Container>
  );
};
