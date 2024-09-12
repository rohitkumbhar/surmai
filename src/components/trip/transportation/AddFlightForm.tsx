import {Button, FileButton, Group, rem, Stack, Text, TextInput, Title} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {Transportation, Trip} from "../../../types/trips.ts";
import {useForm} from "@mantine/form";
import {CurrencyInput} from "../../util/CurrencyInput.tsx";
import {addFlight, saveTransportationAttachments} from "../../../lib";
import {useState} from "react";

export const AddFlightForm = ({trip, onSuccess, onCancel}: {
  trip: Trip,
  onSuccess: () => void,
  onCancel: () => void
}) => {


  const [files, setFiles] = useState<File[]>([]);

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
      currencyCode: 'USD'
    },
    validate: {},
  })

  // @ts-expect-error it ok
  const handleFormSubmit = (values) => {
    addFlight(trip.id, values).then((result: Transportation) => {
        if (files.length > 0) {
          saveTransportationAttachments(result.id, files).then(() => {
            onSuccess()
          });
        } else {
          onSuccess();
        }
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


            <Stack>
              <Group>
                <Title size={"md"}>Attachments
                  <Text size={"xs"} c={"dimmed"}>Upload any related documents for this flight e.g. confirmation
                    email</Text>
                </Title>
              </Group>
              <Group>
                {files.map((file, index) => (
                  <Text key={index}>{file.name}</Text>
                ))}
              </Group>

              <Group>
                <FileButton onChange={setFiles} accept="application/pdf,text/plain,text/html,image/png,image/jpeg,image/gif,image/webp" form={"files"} name={"files"}
                            multiple>
                  {(props) => <Button {...props}>Upload</Button>}
                </FileButton>
              </Group>
            </Stack>
          </Group>
          <Group justify={"flex-end"}>
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

