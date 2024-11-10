import {IconPhoto} from '@tabler/icons-react';
import {ActionIcon, AspectRatio, Badge, Card, Group, Image, Text} from '@mantine/core';
import classes from './TripCard.module.css';
import {Trip} from "../../types/trips.ts";
import {formatDate, getAttachmentUrl} from "../../lib";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";


export function TripCard({trip}: { trip: Trip }) {
  const navigateFunction = useNavigate();
  const {id, name, coverImage, destinations} = trip
  const { i18n } = useTranslation();

  const features = destinations?.map((destination) => (
    <Badge variant="light" key={destination.name}>
      {destination.name}
    </Badge>
  ));

  return (
    <Card withBorder
          radius="md"
          p="md"
          className={classes.card}
          onClick={(event) => {
            navigateFunction(`/trips/${id}`);
            event.preventDefault();
          }}>
      <Card.Section>
        {/*{coverImage && <Image src={getAttachmentUrl(trip, coverImage)} alt={name} height={180}/>}*/}
        <AspectRatio ratio={1920 / 800}>
          {coverImage && (
            <Image
              src={getAttachmentUrl(trip, coverImage)}
              alt={'Cover Image'}
              fit={'cover'}
            />
          )}
          {!coverImage && (
            <ActionIcon
              variant="subtle"
              bd={'solid 1px var(--mantine-primary-color-filled)'}
              aria-label="Settings"
              style={{height: '100%'}}
            >
              <IconPhoto stroke={1.5}/>
            </ActionIcon>
          )}
        </AspectRatio>
      </Card.Section>

      <Card.Section className={classes.section} mt="md">
        <Group justify="apart">
          <Text fz="lg" fw={500}>
            {name}
          </Text>
          {/*<Badge size="sm" variant="light">
            {"Available Offline"}
          </Badge>*/}
        </Group>
        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
          {`${formatDate(i18n.language, trip.startDate)} - ${formatDate(i18n.language, trip.endDate)}`}
        </Text>
      </Card.Section>

      <Card.Section className={classes.section}>
        <Text mt="md" className={classes.label} c="dimmed">
          Destinations
        </Text>
        <Group gap={7} mt={5}>
          {features}
        </Group>
      </Card.Section>
    </Card>
  );
}