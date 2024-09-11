import {Accordion, Button, Container, Group, rem, Text} from "@mantine/core";
import {useForm} from "@mantine/form";
import {IconInfoSquare} from "@tabler/icons-react";
import {createTrip} from "../../lib";
import {useNavigate} from "react-router-dom";
import {CreateTripForm} from "../../types/trips.ts";
import {EditTripBasicForm} from "../../components/trip/EditTripBasicForm.tsx";


export const CreateNewTrip = () => {

  const navigate = useNavigate();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      description: undefined,
      dateRange: [null, null],
      destinations: [],
      participants: []
    },

    validate: {},
  });


  return (
    <Container py="xl">

      <Text size="xl" tt="uppercase" fw={700} mt="md" mb="md">
        Start A New Trip
      </Text>

      <form onSubmit={form.onSubmit((values) => {
        createTrip(values as unknown as CreateTripForm).then(trip => {
          navigate(`/trips/${trip.id}`)
        })
      })}>

        <Accordion chevronPosition="right" variant="contained" value="basic_info">
          <Accordion.Item value={"basic_info"} key={"basic_info"}>
            <Accordion.Control icon={
              <IconInfoSquare
                style={{color: 'var(--mantine-color-blue-6', width: rem(40), height: rem(40)}}
              />
            }>
              <Group wrap="nowrap">
                <div>
                  <Text>{"Basic Information"}</Text>
                  <Text size="sm" c="dimmed" fw={400}>
                    {"Enter some basic information about your trip to get started"}
                  </Text>
                </div>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <EditTripBasicForm form={form} />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Button fullWidth mt="xl" type={"submit"}>
          Create Trip
        </Button>

      </form>
    </Container>)
}