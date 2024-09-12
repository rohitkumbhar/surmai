import {Stack, TagsInput, Textarea, TextInput} from "@mantine/core";
import {DatePickerInput} from "@mantine/dates";

interface EditTripBasicFormProps {
  form: any;
}

export const EditTripBasicForm = ({form}: EditTripBasicFormProps) => {

  return (<Stack
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

    <TagsInput label="Destinations" required
               key={form.key('destinations')} {...form.getInputProps('destinations')}
               acceptValueOnBlur
               description={"Enter the destinations in this trip e.g. San Jose, Guanacaste"}
               placeholder="Enter names"/>

    <DatePickerInput
      type="range"
      required
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


  </Stack>)
}