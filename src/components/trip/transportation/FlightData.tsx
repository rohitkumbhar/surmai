import {Transportation, Trip} from "../../../types/trips.ts";
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  CloseButton,
  Group,
  Paper,
  rem,
  Stack,
  Text,
  Title,
  Tooltip
} from "@mantine/core";
import {IconChevronsRight, IconPlaneArrival, IconPlaneDeparture, IconTrash} from "@tabler/icons-react";
import {deleteTransportation, deleteTransportationAttachment, getAttachmentUrl} from "../../../lib";
import {formatDate, formatTime} from "./util.ts";

export const FlightData = ({flight, refetch}: { trip: Trip, flight: Transportation, refetch: () => void }) => {

  return (
    <Paper withBorder>
      <Group>
        <Group pl={"xs"}>
          <Tooltip label={flight.metadata.airline}>
            <Avatar name={flight.metadata.airline} size={"lg"} color="initials"
                    allowedInitialsColors={['blue', 'red']} radius={"9"}/>
          </Tooltip>
        </Group>
        <Group justify="flex-start" p={"10px"} gap={"md"}>
          <Group miw={rem(150)} maw={rem(150)}>
            <IconPlaneDeparture size="1.4rem" stroke={1.5}/>
            <Title size="md" fw={400}>
              {flight.origin}
              <Text size="xs" c={"dimmed"}>
                {formatDate(flight.departureTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {formatTime(flight.departureTime)}
              </Text>
            </Title>
          </Group>
          <IconChevronsRight/>
          <Group miw={rem(150)} maw={rem(150)}>
            <IconPlaneArrival size="1.4rem" stroke={1.5}/>
            <Title size="md" fw={400}>
              {flight.destination}
              <Text size="xs" c={"dimmed"}>
                {formatDate(flight.arrivalTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {formatTime(flight.arrivalTime)}
              </Text>
            </Title>
          </Group>
        </Group>

        <Stack gap={"1"} pl={"md"} miw={rem(90)}>
          <Text fw={400} c={"dimmed"}>Flight</Text>
          <Text tt="uppercase">{flight.metadata.flightNumber}</Text>
        </Stack>

        <Stack gap={"1"} pl={"md"} miw={rem(150)}>
          <Text fw={400} c={"dimmed"}>Confirmation Code</Text>
          <Text tt="uppercase">{flight.metadata.confirmationCode}</Text>
        </Stack>

        <Stack gap={"1"} pl={"md"} miw={rem(200)}>
          <Text fw={400} c={"dimmed"}>Cost</Text>
          <Text tt="uppercase">{`${flight.cost.value} ${flight.cost.currency || ''}`}</Text>
        </Stack>

        <Group>
          <ActionIcon variant={"transparent"} c={"red"} size="1.4rem" onClick={() => {
            deleteTransportation(flight.id).then(() => {
              refetch()
            })
          }}>
            <IconTrash/>
          </ActionIcon>
        </Group>

      </Group>
      {flight.attachments?.length > 0 && <Group p={"sm"}>
        {(flight.attachments || []).map(attachmentName => {
          return (
            <Anchor href={getAttachmentUrl(flight, attachmentName)} target={"_blank"} key={attachmentName}>
              <Badge variant={"transparent"} size={"lg"} bd={"1px solid #ccc"} radius={0}
                     rightSection={<CloseButton onClick={(event) => {
                       event.preventDefault()
                       deleteTransportationAttachment(flight.id, attachmentName).then(() => {
                         refetch()
                       })
                     }}/>}>{attachmentName}</Badge>
            </Anchor>
          )
        })}
      </Group>}
    </Paper>
  )
}