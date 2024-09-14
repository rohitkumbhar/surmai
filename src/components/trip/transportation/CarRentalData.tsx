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
import {IconCarSuv, IconChevronsRight, IconTrash} from "@tabler/icons-react";
import {deleteTransportation, deleteTransportationAttachment, getAttachmentUrl} from "../../../lib";
import {formatDate, formatTime} from "./util.ts";
import {useTranslation} from "react-i18next";

export const CarRentalData = ({rental, refetch}: { trip: Trip, rental: Transportation, refetch: () => void }) => {

  const {t, i18n} = useTranslation()

  return (
    <Paper withBorder>
      <Group>
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

        {/*<Group>
          <ActionIcon variant={"transparent"} c={"red"} size="1.4rem" onClick={() => {
            deleteTransportation(rental.id).then(() => {
              refetch()
            })
          }}>
            <IconTrash/>
          </ActionIcon>
        </Group>*/}

      </Group>
      <Group>

        {rental.attachments && rental.attachments.length > 0 && <Group p={"sm"}>
          {(rental.attachments || []).map(attachmentName => {
            return (
              <Anchor href={getAttachmentUrl(rental, attachmentName)} target={"_blank"} key={attachmentName}>
                <Badge variant={"transparent"} size={"lg"} bd={"1px solid #ccc"} radius={0}
                       rightSection={<CloseButton onClick={(event) => {
                         event.preventDefault()
                         deleteTransportationAttachment(rental.id, attachmentName).then(() => {
                           refetch()
                         })
                       }}/>}>{attachmentName}</Badge>
              </Anchor>
            )
          })}
        </Group>}

        <Group align={"flex-end"}>
          <ActionIcon variant={"transparent"} c={"red"} size="1.4rem" onClick={() => {
            deleteTransportation(rental.id).then(() => {
              refetch()
            })
          }}>
            <IconTrash/>
          </ActionIcon>
        </Group>

      </Group>


    </Paper>
  )
}