import {Button, FileButton, Group, rem, Stack, Text, TextInput, Title} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {CreateTransportation, Transportation, TransportationFormSchema, Trip} from "../../../types/trips.ts";
import {useForm} from "@mantine/form";
import {CurrencyInput} from "../../util/CurrencyInput.tsx";
import {createTransportationEntry, saveTransportationAttachments} from "../../../lib";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {ContextModalProps} from "@mantine/modals";
import {updateTransportation} from "../../../lib/pocketbase/trips.ts";

export const GenericTransportationModeForm = ({context, id, innerProps}: ContextModalProps<{
  transportationType: string,
  trip: Trip,
  transportation?: Transportation,
  onSuccess: () => void,
  onCancel: () => void
}>) => {

  const {transportationType, trip, transportation, onSuccess, onCancel} = innerProps;
  const {t} = useTranslation()
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<TransportationFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      origin: transportation?.origin,
      departureTime: transportation?.departureTime,
      destination: transportation?.destination,
      arrivalTime: transportation?.arrivalTime,
      provider: transportation?.metadata?.provider,
      reservation: transportation?.metadata?.reservation,
      cost: transportation?.cost?.value,
      currencyCode: transportation?.cost?.currency || 'USD'
    },
    validate: {},
  })

  // @ts-expect-error it ok
  const handleFormSubmit = (values) => {
    const payload: CreateTransportation = {
      type: transportationType,
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
        provider: values.provider,
        reservation: values.reservation
      }
    }

    if (transportation?.id) {
      // Update an existing flight
      updateTransportation(transportation.id, payload).then((result) => {
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
            <DateTimePicker highlightToday valueFormat="lll" name={"departureTime"}
                            w={rem('200px')}
                            label={t('transportation.departure_time', "Departure Time")} clearable required
                            key={form.key('departureTime')} {...form.getInputProps('departureTime')} miw={rem(150)}/>

          </Group>
          <Group>
            <TextInput name={"to"} label={t('transportation.to', "To")} required
                       key={form.key('destination')} {...form.getInputProps('destination')}/>
            <DateTimePicker valueFormat="lll" name={"arrivalTime"}
                            label={t('transportation.arrival_time', "Arrival Time")} required
                            w={rem('200px')}
                            clearable
                            key={form.key('arrivalTime')} {...form.getInputProps('arrivalTime')}/>
          </Group>
          <Group>
            <TextInput name={"provider"} label={t('transportation.provider', 'Provider')} required
                       key={form.key('provider')} {...form.getInputProps('provider')}/>

            <TextInput name={"reservation"} label={t('transportation.reservation', 'Reservation')}
                       key={form.key('reservation')} {...form.getInputProps('reservation')}/>


          </Group>
          <Group>
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
                    {t('transportation.attachments_desc', 'Upload any related documents e.g. confirmation email')}
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
                    if (transportation?.id) {
                      return (<Stack>
                        <Text
                          size={"xs"}>{`${transportation.attachments ? transportation.attachments.length : 0} existing files`}</Text>
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
              {t('save', 'Save')}
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

