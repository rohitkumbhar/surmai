import {Button, FileButton, Group, rem, Stack, Text, TextInput, Title} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {CreateTransportation, Transportation, Trip} from "../../../types/trips.ts";
import {useForm} from "@mantine/form";
import {CurrencyInput} from "../../util/CurrencyInput.tsx";
import {createTransportationEntry, saveTransportationAttachments} from "../../../lib";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {ContextModalProps} from "@mantine/modals";
import {updateTransportation} from "../../../lib/pocketbase/trips.ts";

export const FlightForm = ({context, id, innerProps}: ContextModalProps<{
  trip: Trip,
  flight?: Transportation,
  onSuccess: () => void,
  onCancel: () => void
}>) => {

  const {trip, flight, onSuccess, onCancel} = innerProps;
  const {t} = useTranslation()
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      origin: flight?.origin,
      departureTime: flight?.departureTime,
      destination: flight?.destination,
      arrivalTime: flight?.arrivalTime,
      airline: flight?.metadata?.airline,
      flightNumber: flight?.metadata?.flightNumber,
      confirmationCode: flight?.metadata?.confirmationCode,
      cost: flight?.cost?.value,
      currencyCode: flight?.cost?.currency || 'USD'
    },
    validate: {},
  })

  // @ts-expect-error it ok
  const handleFormSubmit = (values) => {
    const payload: CreateTransportation = {
      type: 'flight',
      origin: values.origin,
      destination: values.destination,
      cost: {
        value: values.cost,
        currency: values.currencyCode
      },
      departureTime: values.departureTime?.toISOString(),
      arrivalTime: values.arrivalTime?.toISOString(),
      trip: trip.id,
      metadata: {
        airline: values.airline,
        flightNumber: values.flightNumber,
        confirmationCode: values.confirmationCode
      }
    }

    if (flight?.id) {
      // Update an existing flight
      updateTransportation(flight.id, payload).then((result) => {
        if (files.length > 0) {
          saveTransportationAttachments(result.id, files).then(() => {
            onSuccess()
          })
        } else {
          onSuccess()
        }
      }).finally(() => {
        context.closeModal(id)
      })
    } else {
      createTransportationEntry(payload).then((result: Transportation) => {
          if (files.length > 0) {
            saveTransportationAttachments(result.id, files).then(() => {
              context.closeModal(id)
              onSuccess()
            });
          } else {
            context.closeModal(id)
            onSuccess();
          }
        }
      )
    }
  }

  return (
    <Stack>
      <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
        <Stack>
          <Group>
            <TextInput name={"from"} label={t('transportation.from', "From")} required
                       key={form.key('origin')} {...form.getInputProps('origin')}/>
            <DateTimePicker highlightToday valueFormat="DD MMM YYYY hh:mm A" name={"departureTime"}
                            label={t('transportation.departure_time', "Departure Time")} clearable required
                            key={form.key('departureTime')} {...form.getInputProps('departureTime')} miw={rem(150)}/>
            <TextInput name={"to"} label={t('transportation.to', "To")} required
                       key={form.key('destination')} {...form.getInputProps('destination')}/>
            <DateTimePicker valueFormat="DD MMM YYYY hh:mm A" name={"arrivalTime"}
                            label={t('transportation.arrival_time', "Arrival Time")} required
                            miw={rem(150)}
                            clearable
                            key={form.key('arrivalTime')} {...form.getInputProps('arrivalTime')}/>
          </Group>
          <Group>
            <TextInput name={"airline"} label={t('transportation.airline', 'Airline')} required
                       key={form.key('airline')} {...form.getInputProps('airline')}/>
            <TextInput name={"flightNumber"} label={t('transportation.flight_number', 'Flight Number')} required
                       key={form.key('flightNumber')} {...form.getInputProps('flightNumber')}/>
            <TextInput name={"confirmationCode"} label={t('transportation.confirmation_code', 'Confirmation Code')}
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
                <Title size={"md"}>{t('attachments', 'Attachments')}
                  <Text size={"xs"} c={"dimmed"}>
                    {t('transportation.attachments_desc', 'Upload any related documents for this flight e.g. confirmation email')}
                  </Text>
                </Title>
              </Group>
              <Group>
                {files.map((file, index) => (
                  <Text key={index}>{file.name}</Text>
                ))}
              </Group>

              <Group>
                <FileButton onChange={setFiles}
                            accept="application/pdf,text/plain,text/html,image/png,image/jpeg,image/gif,image/webp"
                            form={"files"} name={"files"}
                            multiple>
                  {(props) => {
                    if (flight?.id) {
                      return (<Stack>
                        <Text
                          size={"xs"}>{`${flight.attachments ? flight.attachments.length : 0} existing files`}</Text>
                        <Button {...props}>{t('upload_more', 'Upload More')}</Button>
                      </Stack>)
                    } else {
                      return (<Button {...props}>{t('upload', 'Upload')}</Button>)
                    }
                  }}
                </FileButton>
              </Group>
            </Stack>
          </Group>
          <Group justify={"flex-end"}>
            <Button type={"submit"} w={"min-content"}>
              {t('transportation.save_flight', 'Save Flight')}
            </Button>
            <Button type={"button"} variant={"default"} w={"min-content"} onClick={() => {
              context.closeModal(id)
              onCancel()
            }}>
              {t('cancel', "Cancel")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>)
}

