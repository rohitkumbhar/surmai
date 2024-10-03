import {Trip} from "../../../types/trips.ts";
import {useTranslation} from "react-i18next";
import {ActionIcon, AspectRatio, Divider, Flex, Group, Image, Paper, Stack, Text, Title} from "@mantine/core";
import {formatDate, getAttachmentUrl} from "../../../lib";
import {IconPhoto} from "@tabler/icons-react";
import {ParticipantData} from "./ParticipantData.tsx";
import {BasicInfoMenu} from "./BasicInfoMenu.tsx";

export const BasicInfoView = ({trip, refetch}: { trip: Trip, refetch: () => void }) => {

  const {t, i18n} = useTranslation();

  return (<Stack gap={"md"}>
    <AspectRatio ratio={1920 / 400}>
      {trip.coverImage && <Image src={getAttachmentUrl(trip, trip.coverImage)}/>}
      {!trip.coverImage &&
          <ActionIcon variant="subtle" bd={"solid 1px var(--mantine-primary-color-filled)"} aria-label="Settings"
                      style={{height: '100%'}}>
              <IconPhoto stroke={1.5}/>
          </ActionIcon>}
    </AspectRatio>
    <Flex
      mih={30}
      justify="flex-end"
      align="center"
      wrap="wrap"
      pos={"relative"}
      top={"20px"}
    >
      <BasicInfoMenu trip={trip} refetch={refetch} />
    </Flex>
    <Title order={1}>{trip.name}</Title>
    <Title order={4} fw={400}> {trip.description}</Title>
    <Text size={"sm"}>{formatDate(i18n.language, trip.startDate)} - {formatDate(i18n.language, trip.endDate)}</Text>
    <Divider/>
    <Text mt={"md"}>{t('basic.visiting', 'Visiting')}</Text>
    <Group>
      {(trip.destinations || []).map(destination => {
        return (
          <Group wrap={"nowrap"} key={destination.name}>
            <Paper shadow="sm" radius="sm" p="xl" bg={"var(--mantine-primary-color-light)"}>
              <IconPhoto/>
              <Text>{destination.name}</Text>
            </Paper>
          </Group>)
      })}
    </Group>
    <Divider/>
    <Text mt={"md"}>{t('basic.with', 'Going With')}</Text>
    <Group>
      {(trip.participants || []).map((person, index) => {
        return (<Group wrap={"nowrap"} key={person.name}>
          <ParticipantData participant={person} trip={trip} index={index} refetch={refetch}/>
        </Group>)
      })}
    </Group>

  </Stack>)
}