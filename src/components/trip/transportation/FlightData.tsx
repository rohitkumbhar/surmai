import {Transportation, Trip} from "../../../types/trips.ts";
import {Avatar, Group, rem, Stack, Text, Title, Tooltip} from "@mantine/core";
import {IconChevronsRight, IconPlaneArrival, IconPlaneDeparture} from "@tabler/icons-react";
import {deleteTransportation} from "../../../lib";
import {formatDate, formatTime} from "./util.ts";
import {useTranslation} from "react-i18next";
import {Attachments} from "./Attachments.tsx";
import {DataLine} from "../DataLine.tsx";
import {closeModal, openConfirmModal, openContextModal} from "@mantine/modals";
import {useMediaQuery} from "@mantine/hooks";
import {notifications} from "@mantine/notifications";

export const FlightData = ({trip, flight, refetch}: { trip: Trip, flight: Transportation, refetch: () => void }) => {

  const {t, i18n} = useTranslation()
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <DataLine
      onEdit={() => {
        openContextModal({
          modal: 'addFlightForm',
          title: t('transportation.edit_flight', 'Edit Flight'),
          radius: 'md',
          withCloseButton: false,
          fullScreen: isMobile,
          innerProps: {
            trip: trip,
            flight: flight,
            onSuccess: () => {
              closeModal('addFlightForm')
              refetch()
            },
            onCancel: () => {
              closeModal('addFlightForm')
            }
          },
        });
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_flight', 'Delete Flight'),
          confirmProps: { color: 'red' },
          children: (
            <Text size="sm">
              {t('deletion_confirmation', 'This action cannot be undone.')}
            </Text>
          ),
          labels: {confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel')},
          onCancel: () => console.log('Cancel'),
          onConfirm: () => {
            deleteTransportation(flight.id).then(() => {
              notifications.show({
                title: 'Flight deleted',
                message: `Flight from ${flight.origin} to ${flight.destination} has been deleted`,
                position: 'top-right'
              })
              refetch()
            })
          },
        })
      }}>
      <Group>
        <Group pl={"xs"}>
          <Tooltip label={flight.metadata.airline}>
            <Avatar name={flight.metadata.airline} size={"lg"} color="initials"
                    radius={"9"}/>
          </Tooltip>
        </Group>
        <Group justify="flex-start" p={"10px"} gap={"md"}>
          <Group miw={rem(150)} maw={rem(150)}>
            <IconPlaneDeparture size="1.4rem" stroke={1.5}/>
            <Title size="md" fw={400}>
              {flight.origin}
              <Text size="xs" c={"dimmed"}>
                {formatDate(i18n.language, flight.departureTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {formatTime(i18n.language, flight.departureTime)}
              </Text>
            </Title>
          </Group>
          <IconChevronsRight/>
          <Group miw={rem(150)} maw={rem(150)}>
            <IconPlaneArrival size="1.4rem" stroke={1.5}/>
            <Title size="md" fw={400}>
              {flight.destination}
              <Text size="xs" c={"dimmed"}>
                {formatDate(i18n.language, flight.arrivalTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {formatTime(i18n.language, flight.arrivalTime)}
              </Text>
            </Title>
          </Group>
        </Group>

        <Stack gap={"1"} pl={"md"} miw={rem(90)}>
          <Text fw={400} c={"dimmed"}>{t('transportation.flight_number', 'Flight #')}</Text>
          <Text tt="uppercase">{flight.metadata.flightNumber}</Text>
        </Stack>

        <Stack gap={"1"} pl={"md"} miw={rem(150)}>
          <Text fw={400} c={"dimmed"}>{t('transportation.confirmation_code', 'Confirmation Code')}</Text>
          <Text tt="uppercase">{flight.metadata.confirmationCode}</Text>
        </Stack>

        <Stack gap={"1"} pl={"md"} miw={rem(200)}>
          <Text fw={400} c={"dimmed"}>{t('cost', 'Cost')}</Text>
          <Text tt="uppercase">{`${flight.cost.value} ${flight.cost.currency || ''}`}</Text>
        </Stack>

      </Group>
      <Attachments transportation={flight} refetch={refetch}/>
    </DataLine>
  )
}