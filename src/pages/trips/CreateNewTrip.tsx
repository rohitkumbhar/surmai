import {Button, Container, Text, Textarea, TextInput} from "@mantine/core";
import {useForm} from "@mantine/form";
import { DatePickerInput } from '@mantine/dates';

export const CreateNewTrip = () => {

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      description: '',
      startDate: undefined,
      endDate: undefined,
      destinations: []
    },

    validate: {},
  });

  return (<Container py="xl">
    <Text size="xl" tt="uppercase" fw={700} mt="md" mb="md">
      Start A New Trip
    </Text>
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <TextInput label="Name" placeholder="Name" mt={"md"} required
                 key={form.key('name')} {...form.getInputProps('name')}/>


      <Textarea
        label="Brief Description"
        description="Brief description of the trip"
        placeholder=""
        key={form.key('description')} {...form.getInputProps('description')}
      />

      <DatePickerInput
        label="Start Date"
        placeholder="Pick date"
        key={form.key('startDate')} {...form.getInputProps('startDate')}
      />

      <DatePickerInput
        label="End Date"
        placeholder="Pick date"
        key={form.key('endDate')} {...form.getInputProps('endDate')}


      />

      <Button fullWidth mt="xl" type={"submit"}>
        Create Trip
      </Button>

    </form>
  </Container>)
}