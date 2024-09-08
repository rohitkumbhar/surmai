import {Accordion, Button, Container, Group, rem, Stack, TagsInput, Text, Textarea, TextInput} from "@mantine/core";
import {useForm} from "@mantine/form";
import {DatePickerInput} from '@mantine/dates';
import {IconInfoSquare} from "@tabler/icons-react";
import {CreateTripFormData} from "../../types/trips.ts";
import {createTrip} from "../../lib/pocketbase/trips.ts";
import {useNavigate} from "react-router-dom";


export const CreateNewTrip = () => {

  const navigate = useNavigate();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      description: undefined,
      startDate: new Date(),
      endDate: undefined,
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


      <form onSubmit={form.onSubmit((values: CreateTripFormData) => {
        createTrip(values).then(trip => {
          console.log("Created Trip =>", trip)
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
                           description={"Enter the destinations in this trip e.g. San Jose, Guanacaste"}
                           placeholder="Enter names" />

                <Group w={"100%"} grow>
                  <DatePickerInput
                    label="Start Date"
                    description={"Select the date of your departure"}
                    placeholder="Pick date"
                    key={form.key('startDate')} {...form.getInputProps('startDate')}
                  />

                  <DatePickerInput
                    label="End Date"
                    description={"Select the date of your return"}
                    placeholder="Pick date"
                    key={form.key('endDate')} {...form.getInputProps('endDate')}

                  />
                </Group>

                <TagsInput label="Accompanying travellers"
                           key={form.key('participants')} {...form.getInputProps('participants')}
                           description={"Enter the names of friends or family joining you on this trip. Multiple names can be separated by a comma"}
                           placeholder="Enter names" />


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