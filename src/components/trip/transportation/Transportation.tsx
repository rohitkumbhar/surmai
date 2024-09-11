import {ActionIcon, Avatar, Container, Flex, Group, LoadingOverlay, Paper, Stack, Text, Tooltip} from "@mantine/core";
import {Trip} from "../../../types/trips.ts";
import {AddTransportationMenu} from "./AddTransportationMenu.tsx";
import {useState} from "react";
import {AddFlightForm} from "./AddFlightForm.tsx";
import {useQuery} from "@tanstack/react-query";
import {listTransportations} from "../../../lib/pocketbase/trips.ts";
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
                <Group justify="flex-start" p={"10px"} gap={"xl"}>
                  <Group>

                    <Tooltip label={t.metadata.airline}>
                      <Avatar name={t.metadata.airline} color="initials" allowedInitialsColors={['blue', 'red']} radius={"1"} />
                    </Tooltip>


                    <IconPlaneDeparture size="1.4rem" stroke={1.5} />
                    <Text size="md" >
                      {t.origin}
                      <Text size="xs" c={"dimmed"}>
                        {formatDate(t.departureTime)}
                      </Text>
                      <Text size="xs" c={"dimmed"}>
                        {formatTimes(t.departureTime)}
                      </Text>
                    </Text>
                  </Group>


                  <IconChevronsRight />

                  <Group>
                    <IconPlaneArrival size="1.4rem" stroke={1.5} />
                    <Text size="md" >
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
                <Group grow align={"flex-end"} justify={"flex-end"} >
                  <ActionIcon variant="transparent" aria-label="Delete">
                    <Tooltip label={"Delete"}>
                      <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} color={"red"} />
                    </Tooltip>
                  </ActionIcon>
                </Group>
              </Group>



            </Paper>
          )
        })}

      </Stack>


    </Container>)
}