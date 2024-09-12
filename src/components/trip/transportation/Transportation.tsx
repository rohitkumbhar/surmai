import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  CloseButton,
  Container,
  Divider,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  rem,
  Stack,
  Text,
  Tooltip
} from "@mantine/core";
import {Trip} from "../../../types/trips.ts";
import {AddTransportationMenu} from "./AddTransportationMenu.tsx";
import {useState} from "react";
import {AddFlightForm} from "./AddFlightForm.tsx";
import {useQuery} from "@tanstack/react-query";
import {deleteTransportation, deleteTransportationAttachment, getAttachmentUrl, listTransportations} from "../../../lib";
import {IconChevronsRight, IconPlaneArrival, IconPlaneDeparture, IconTrash} from "@tabler/icons-react";


export const Transportation = ({trip}: {
  trip: Trip,
}) => {

  const tripId = trip.id
  const [newOption, setNewOption] = useState<string>()
  const {isPending, isError, data, error, refetch} = useQuery<any>({
    queryKey: ['listTransportations', tripId],
    queryFn: () => listTransportations(tripId || ''),
  })


  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{radius: "sm", blur: 2}}/>
  }

  if (isError) {
    throw new Error(error.message)
  }

  const formatTimes = (input: Date) => {
    return input.toLocaleTimeString('en-us', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (input: Date) => {
    return input.toLocaleDateString('en-us', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Container py={"xs"} size="lg">
      <Flex
        mih={50}
        gap="md"
        justify="flex-end"
        align="center"
        direction="row"
        wrap="wrap"
      >
        {!newOption && <AddTransportationMenu setSelectedOption={(val) => {
          setNewOption(val)
        }}/>}
      </Flex>

      {newOption === 'flight' && <AddFlightForm trip={trip} onCancel={() => setNewOption(undefined)} onSuccess={() => {
        setNewOption(undefined)
        refetch()
      }}/>}

      <Stack mt={"sm"}>
        {data.map((t) => {

          return (
            <Paper withBorder>
              <Group>
                <Group pl={"xs"}>
                  <Tooltip label={t.metadata.airline}>
                    <Avatar name={t.metadata.airline} size={"lg"} color="initials"
                            allowedInitialsColors={['blue', 'red']} radius={"1"}/>
                  </Tooltip>
                </Group>
                <Group justify="flex-start" p={"10px"} gap={"md"} >
                  <Group miw={rem(150)} maw={rem(150)}>
                    <IconPlaneDeparture size="1.4rem" stroke={1.5}/>
                    <Text size="md">
                      {t.origin}
                      <Text size="xs" c={"dimmed"}>
                        {formatDate(t.departureTime)}
                      </Text>
                      <Text size="xs" c={"dimmed"}>
                        {formatTimes(t.departureTime)}
                      </Text>
                    </Text>
                  </Group>
                  <IconChevronsRight/>
                  <Group miw={rem(150)} maw={rem(150)}>
                    <IconPlaneArrival size="1.4rem" stroke={1.5}/>
                    <Text size="md">
                      {t.destination}
                      <Text size="xs" c={"dimmed"}>
                        {formatDate(t.arrivalTime)}
                      </Text>
                      <Text size="xs" c={"dimmed"}>
                        {formatTimes(t.arrivalTime)}
                      </Text>
                    </Text>
                  </Group>
                </Group>

                <Stack gap={"1"} pl={"md"} miw={rem(90)}>
                  <Text fw={400} c={"dimmed"}>Flight</Text>
                  <Text tt="uppercase">{t.metadata.flightNumber}</Text>
                </Stack>

                <Stack gap={"1"} pl={"md"} miw={rem(150)}>
                  <Text fw={400} c={"dimmed"}>Confirmation Code</Text>
                  <Text tt="uppercase">{t.metadata.confirmationCode}</Text>
                </Stack>

                <Stack gap={"1"} pl={"md"} miw={rem(200)}>
                  <Text fw={400} c={"dimmed"}>Cost</Text>
                  <Text tt="uppercase">{`${t.cost.value} ${t.cost.currency || ''}`}</Text>
                </Stack>

                <Group>
                  <ActionIcon variant={"transparent"} c={"red"} size="1.4rem" onClick={() => {
                    deleteTransportation(t.id).then(() => { refetch()})
                  }}>
                    <IconTrash />
                  </ActionIcon>
                </Group>

              </Group>
              {t.files?.length > 0 && <Group p={"sm"} >
                {(t.files || []).map(f => {
                  return (
                    <Anchor href={getAttachmentUrl(t,f)} target={"_blank"}>
                      <Badge variant={"transparent"} size={"lg"} bd={"1px solid #ccc"} radius={0}
                             rightSection={<CloseButton onClick={(event) => {
                               event.preventDefault()
                               deleteTransportationAttachment(t.id, f).then(() => {
                                 refetch()
                               })
                             }} />}>{f}</Badge>
                    </Anchor>
                  )
                })}
              </Group>}
            </Paper>
          )
        })}

      </Stack>


    </Container>)
}