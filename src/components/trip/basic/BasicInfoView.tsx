import {Trip} from "../../../types/trips.ts";
import {useTranslation} from "react-i18next";
import {Divider, Group, Paper, Stack, Text, Title} from "@mantine/core";
import {formatDate} from "../../../lib";
import {IconPhoto} from "@tabler/icons-react";
import {ParticipantData} from "./ParticipantData.tsx";

export const BasicInfoView = ({trip, refetch}: { trip: Trip, refetch: () => void }) => {

  const {t, i18n} = useTranslation();

  return (<Stack gap={"md"}>
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