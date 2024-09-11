import {Button, Group, rem, Stack, TextInput, Title} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {Trip} from "../../../types/trips.ts";
import {useForm} from "@mantine/form";
import {CurrencyInput} from "../../util/CurrencyInput.tsx";
import {addFlight} from "../../../lib/pocketbase/trips.ts";

export const AddFlightForm = ({trip, onSuccess, onCancel}: {
  trip: Trip,
  onSuccess: () => void,
  onCancel: () => void
}) => {


  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      origin: undefined,
      departureTime: undefined,
      destination: undefined,
      arrivalTime: undefined,
      airline: undefined,
      flightNumber: undefined,
      confirmationCode: undefined,
      cost: undefined,
      currencyCode: undefined
    },
    validate: {},
  })

  const handleFormSubmit = (values) => {
    addFlight(trip.id, values).then(() => {
        onSuccess();
      }
    )
  }

  return (
    <Stack>
      <Title order={4}>Add new flight</Title>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Group>
            <TextInput name={"from"} label={"From"} required
                       key={form.key('origin')} {...form.getInputProps('origin')}/>
            <DateTimePicker highlightToday valueFormat="DD MMM YYYY hh:mm A" name={"departureTime"}
                            label={"Departure Time"} clearable required
                            key={form.key('departureTime')} {...form.getInputProps('departureTime')} miw={rem(150)}/>
            <TextInput name={"to"} label={"To"} required
                       key={form.key('destination')} {...form.getInputProps('destination')}/>
            <DateTimePicker valueFormat="DD MMM YYYY hh:mm A" name={"arrivalTime"} label={"Arrival Time"} required
                            miw={rem(150)}
                            clearable
                            key={form.key('arrivalTime')} {...form.getInputProps('arrivalTime')}/>
          </Group>
          <Group>
            <TextInput name={"airline"} label={"Airline"} required
                       key={form.key('airline')} {...form.getInputProps('airline')}/>
            <TextInput name={"flightNumber"} label={"Flight Number"} required
                       key={form.key('flightNumber')} {...form.getInputProps('flightNumber')}/>
            <TextInput name={"confirmationCode"} label={"Confirmation Code"}
                       key={form.key('confirmationCode')} {...form.getInputProps('confirmationCode')}/>

            <CurrencyInput
              costKey={form.key('cost')}
              costProps={form.getInputProps('cost')}
              currencyCodeKey={form.key('currencyCode')}
              currencyCodeProps={form.getInputProps('currencyCode')}
            />
          </Group>
          <Group>
            <Button type={"submit"} w={"min-content"}>
              Save Flight
            </Button>
            <Button type={"button"} variant={"default"} w={"min-content"} onClick={onCancel}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>)
}