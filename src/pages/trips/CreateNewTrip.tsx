import { Accordion, Button, Container, Group, rem, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoSquare } from '@tabler/icons-react';
import { createTrip, currentUser } from '../../lib';
import { useNavigate } from 'react-router-dom';
import { CreateTripForm, NewTrip } from '../../types/trips.ts';
import { EditTripBasicForm } from '../../components/trip/basic/EditTripBasicForm.tsx';
import { basicInfoFormValidation } from '../../components/trip/basic/validation.ts';
import { useTranslation } from 'react-i18next';

export const CreateNewTrip = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      <Text size="xl" tt="uppercase" fw={700} mt="md" mb="md">
        {t('trip.new', 'Start A New Trip')}
      </Text>

      <form
        onSubmit={form.onSubmit(async (values) => {
          const user = await currentUser();
          const { name, description, dateRange, participants, destinations } =
            values;
          const data: NewTrip = {
            name: name,
            description: description,
            startDate: dateRange[0] || new Date(),
            endDate: dateRange[1] || new Date(),
            ownerId: user.id,
            participants: participants?.map((p) => {
              return { name: p };
            }),
            destinations: destinations?.map((d) => {
              return { name: d };
            }),
          };

          createTrip(data).then((trip) => {
            navigate(`/trips/${trip.id}`);
          });
        })}
      >
        <Accordion
          chevronPosition="right"
          variant="contained"
          value="basic_info"
        >
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
                    {
                      'Enter some basic information about your trip to get started'
                    }
                  </Text>
                </div>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <EditTripBasicForm form={form} />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Button fullWidth mt="xl" type={'submit'}>
          Create Trip
        </Button>
      </form>
    </Container>
  );
};
