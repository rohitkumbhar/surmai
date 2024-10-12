import {Transportation, Trip} from "../../../types/trips.ts";
import {Box, Center, Divider, Grid, Text, Title, Tooltip} from "@mantine/core";
import {IconBus, IconCar, IconPlaneInflight, IconShip, IconTrain} from "@tabler/icons-react";
import {deleteTransportation, deleteTransportationAttachment} from "../../../lib";
import {formatDate, formatTime, getTravelTime} from "../common/util.ts";
import {useTranslation} from "react-i18next";
import {Attachments} from "../common/Attachments.tsx";
import {DataLine} from "../DataLine.tsx";
import {closeModal, openConfirmModal, openContextModal} from "@mantine/modals";
import {useMediaQuery} from "@mantine/hooks";
import {notifications} from "@mantine/notifications";


const typeIcons = {
  boat: IconShip,
  bus: IconBus,
  flight: IconPlaneInflight,
  train: IconTrain,
  car: IconCar
}

export const GenericTransportationData = ({trip, transportation, refetch}: {
  trip: Trip,
  transportation: Transportation,
  refetch: () => void
}) => {

  const {t, i18n} = useTranslation()
  const isMobile = useMediaQuery('(max-width: 50em)');


  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[transportation.type] || IconCar

  return (
    <DataLine
      onEdit={() => {
        openContextModal({
          modal: 'genericTransportationForm',
          title: t('Edit', 'Edit'),
          radius: 'md',
          withCloseButton: false,
          fullScreen: isMobile,
          innerProps: {
            transportationType: transportation.type,
            trip: trip,
            transportation: transportation,
            onSuccess: () => {
              closeModal('genericTransportationForm')
              refetch()
            },
            onCancel: () => {
              closeModal('genericTransportationForm')
            }
          },
        });
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_transportation', 'Delete Transportation'),
          confirmProps: {color: 'red'},
          children: (
            <Text size="sm">
              {t('deletion_confirmation', 'This action cannot be undone.')}
            </Text>
          ),
          labels: {confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel')},
          onCancel: () => console.log('Cancel'),
          onConfirm: () => {
            deleteTransportation(transportation.id).then(() => {
              notifications.show({
                title: 'Deleted',
                message: `Transportation from ${transportation.origin} to ${transportation.destination} has been deleted`,
                position: 'top-right'
              })
              refetch()
            })
          },
        })
      }}>
      <Grid align={"top"} p={"xs"} grow={false}>
        <Grid.Col span={{base: 12, sm: 12, md: 1, lg: 1}} p={"md"}>
          <Box component="div" visibleFrom={"md"}>
            <Tooltip label={t(`transportation_type_${transportation.type}`, transportation.type)}>
              <TypeIcon size={"sm"} stroke={1}/>
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={"md"}>
            <Title size={"lg"}>{t(`transportation_type_${transportation.type}`, transportation.type)}</Title>
            <Divider mt={"5px"}/>
          </Box>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 5, md: 2, lg: 1.5}}>
          <Title size="lg" fw={400}>
            {transportation.origin}
            <Text size="xs" c={"dimmed"}>
              {formatDate(i18n.language, transportation.departureTime)}
            </Text>
            <Text size="xs" c={"dimmed"}>
              {formatTime(i18n.language, transportation.departureTime)}
            </Text>
          </Title>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 2, md: 1, lg: 1}}>
          <Center h={"100%"}>
            <Text c={"dimmed"} size={"xs"}>
              {getTravelTime(transportation.departureTime, transportation.arrivalTime)}
            </Text>
          </Center>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 5, md: 2, lg: 1.5}}>
          <Title size="lg" fw={400}>
            {transportation.destination}
            <Text size="xs" c={"dimmed"}>
              {formatDate(i18n.language, transportation.arrivalTime)}
            </Text>
            <Text size="xs" c={"dimmed"}>
              {formatTime(i18n.language, transportation.arrivalTime)}
            </Text>
          </Title>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 6, md: 2, lg: 2}}>
          <Text size="sm" c={"dimmed"}>
            {t('transportation.provider', 'Provider')}
          </Text>
          <Title size="md">
            {transportation.metadata.provider}
          </Title>
        </Grid.Col>
        <Grid.Col span={{base: 12, sm: 6, md: 2, lg: 2}}>
          <Text size="sm" c={"dimmed"}>
            {t('transportation.reservation', 'Reservation')}
          </Text>
          <Title size="md">
            {transportation.metadata.reservation || 'Unknown'}
          </Title>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 6, md: 2, lg: 2}}>

          <Text size="sm" c={"dimmed"}>
            {t('cost', 'Cost')}
          </Text>
          <Title size="md">
            {transportation.cost.value ? `${transportation.cost.value} ${transportation.cost.currency || ''}` : 'Unknown'}
          </Title>
        </Grid.Col>
      </Grid>
      <Attachments entity={transportation} refetch={refetch}
                   onDelete={(attachmentName) => deleteTransportationAttachment(transportation.id, attachmentName)}/>
    </DataLine>
  )
}