import {Transportation, Trip} from "../../../types/trips.ts";
import {Box, Divider, Grid, Text, Title, Tooltip} from "@mantine/core";
import {IconArticle} from "@tabler/icons-react";
import {deleteTransportation, deleteTransportationAttachment} from "../../../lib";
import {formatDate, formatTime} from "../common/util.ts";
import {useTranslation} from "react-i18next";
import {Attachments} from "../attachments/Attachments.tsx";
import {DataLine} from "../DataLine.tsx";
import {closeModal, openContextModal} from "@mantine/modals";
import {useMediaQuery} from "@mantine/hooks";

export const CarRentalData = ({trip, rental, refetch}: { trip: Trip, rental: Transportation, refetch: () => void }) => {

  const {t, i18n} = useTranslation()
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <DataLine
      onEdit={() => {
        openContextModal({
          modal: 'carRentalForm',
          title: t('transportation.edit_car_rental', 'Edit Car Rental'),
          radius: 'md',
          withCloseButton: false,
          fullScreen: isMobile,
          innerProps: {
            trip: trip,
            carRental: rental,
            onSuccess: () => {
              closeModal('carRentalForm')
              refetch()
            },
            onCancel: () => {
              closeModal('carRentalForm')
            }
          },
        });
      }}

      onDelete={() => {
        deleteTransportation(rental.id).then(() => {
          refetch()
        })
      }}>

      <Grid align={"top"} p={"xs"} grow={false}>
        <Grid.Col span={{base: 12, sm: 1, md: 1, lg: 1}} p={"md"}>
          <Box component="div" visibleFrom={"sm"}>
            <Tooltip label={t(`transportation_type_${rental.type}`, rental.type)}>
              <IconArticle size={"sm"} stroke={1}/>
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={"sm"}>
            <Title size={"lg"}>{t(`transportation_type_${rental.type}`, rental.type)}</Title>
            <Divider mt={"5px"}/>
          </Box>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 5, md: 2, lg: 2}}>
          <Text size="xs" c={"dimmed"}>
            {t('transportation.pickup', 'Pickup')}
           </Text>
          <Text size="sm">
            {rental.origin}
          </Text>
          <Text size="sm">
            {`${formatDate(i18n.language, rental.departureTime)} ${formatTime(i18n.language, rental.departureTime)}`}
          </Text>
        </Grid.Col>

        {/*<Grid.Col span={{base: 12, sm: 2, md: 1, lg: 1}}>
          <Text c={"dimmed"} size={"xs"}>
            {getTravelTime(rental.departureTime, rental.arrivalTime)}
          </Text>
        </Grid.Col>*/}

        <Grid.Col span={{base: 12, sm: 5, md: 2, lg: 2}}>
          <Text size="xs" c={"dimmed"}>
            {t('transportation.drop_off', 'Drop Off')}
          </Text>
          <Text size="sm">
            {rental.destination}
          </Text>
          <Text size="sm">
            {`${formatDate(i18n.language, rental.arrivalTime)} ${formatTime(i18n.language, rental.arrivalTime)}`}
          </Text>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 6, md: 2, lg: 2}}>
          <Text size="sm" c={"dimmed"}>
            {t('transportation.provider', 'Provider')}
          </Text>
          <Title size="md">
            {rental.metadata.rentalCompany}
          </Title>
        </Grid.Col>
        <Grid.Col span={{base: 12, sm: 6, md: 2, lg: 2}}>
          <Text size="sm" c={"dimmed"}>
            {t('transportation.reservation', 'Reservation')}
          </Text>
          <Title size="md">
            {rental.metadata.confirmationCode || 'Unknown'}
          </Title>
        </Grid.Col>

        <Grid.Col span={{base: 12, sm: 6, md: 2, lg: 2}}>

          <Text size="sm" c={"dimmed"}>
            {t('cost', 'Cost')}
          </Text>
          <Title size="md">
            {rental.cost.value ? `${rental.cost.value} ${rental.cost.currency || ''}` : 'Unknown'}
          </Title>
        </Grid.Col>
      </Grid>
      <Attachments entity={rental} refetch={refetch}
                   onDelete={(attachmentName) => deleteTransportationAttachment(rental.id, attachmentName)}
      />

      {/*<Group>
        <Group pl={"xs"}>
          <Tooltip label={rental.metadata.rentalCompany}>
            <Avatar name={rental.metadata.rentalCompany} size={"lg"} color="initials"
                    radius={"9"}/>
          </Tooltip>
        </Group>
        <Group justify="flex-start" p={"10px"} gap={"md"}>
          <Group miw={rem(150)} maw={rem(150)}>
            <IconCarSuv size="1.4rem" stroke={1.5}/>
            <Title size="md" fw={400}>
              {t('transportation.pickup', 'Pickup')}
              <Text size="xs" c={"dimmed"}>
                {formatDate(i18n.language, rental.departureTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {formatTime(i18n.language, rental.departureTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {rental.origin}
              </Text>
            </Title>
          </Group>
          <IconChevronsRight/>
          <Group miw={rem(150)} maw={rem(150)}>
            <IconCarSuv size="1.4rem" stroke={1.5}/>
            <Title size="md" fw={400}>
              {t('transportation.drop_off', 'Drop Off')}
              <Text size="xs" c={"dimmed"}>
                {formatDate(i18n.language, rental.arrivalTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {formatTime(i18n.language, rental.arrivalTime)}
              </Text>
              <Text size="xs" c={"dimmed"}>
                {rental.destination}
              </Text>
            </Title>
          </Group>
        </Group>

        <Stack gap={"1"} pl={"md"} miw={rem(150)}>
          <Text fw={400} c={"dimmed"}>{t('transportation.confirmation_code', 'Confirmation Code')}</Text>
          <Text tt="uppercase">{rental.metadata.confirmationCode}</Text>
        </Stack>

        <Stack gap={"1"} pl={"md"} miw={rem(200)}>
          <Text fw={400} c={"dimmed"}>{t('cost', 'Cost')}</Text>
          <Text tt="uppercase">{`${rental.cost.value} ${rental.cost.currency || ''}`}</Text>
        </Stack>
      </Group>

      <Group>
        <Attachments transportation={rental} refetch={refetch}/>
      </Group>*/}
    </DataLine>
  )
}