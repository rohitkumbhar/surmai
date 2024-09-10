import {Accordion, Button, Container, Group, rem, Stack, TagsInput, Text, Textarea, TextInput} from "@mantine/core";
import {useForm} from "@mantine/form";
import {DatePickerInput} from '@mantine/dates';
import {IconInfoSquare} from "@tabler/icons-react";
import {createTrip} from "../../lib";
import {useNavigate} from "react-router-dom";
import {CreateTripForm} from "../../types/trips.ts";


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
              <Stack
                align="stretch"
                justify="center"
                gap="md"
              >
                <TextInput label="Name" placeholder="Name" mt={"md"} required
                           description={"A short name for your trip e.g. Summer 2025 in Costa Rica"}
                           key={form.key('name')} {...form.getInputProps('name')}/>


                <Textarea
                  label="Brief Description"
                  description="Optional: Brief description of the trip"
                  placeholder=""
                  key={form.key('description')} {...form.getInputProps('description')}
                />

                <TagsInput label="Destinations"
                           key={form.key('destinations')} {...form.getInputProps('destinations')}
                           acceptValueOnBlur
                           description={"Enter the destinations in this trip e.g. San Jose, Guanacaste"}
                           placeholder="Enter names"/>

                <DatePickerInput
                  type="range"
                  label="Trip Dates"
                  description={"Select the start and end dates of your trip"}
                  placeholder="Pick date"
                  key={form.key('dateRange')} {...form.getInputProps('dateRange')}
                />

                <TagsInput label="Accompanying travellers"
                           key={form.key('participants')} {...form.getInputProps('participants')}
                           acceptValueOnBlur
                           description={"Enter the names of friends or family joining you on this trip. Multiple names can be separated by a comma"}
                           placeholder="Enter names"/>


              </Stack>


            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Button fullWidth mt="xl" type={"submit"}>
          Create Trip
        </Button>

      </form>
    </Container>)
}