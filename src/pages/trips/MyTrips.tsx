import {
  ActionIcon,
  AspectRatio,
  Card,
  Container,
  Divider,
  Image,
  LoadingOverlay,
  SimpleGrid,
  Text
} from '@mantine/core';
import classes from './MyTrips.module.css';
import {IconPhoto, IconPlus,} from '@tabler/icons-react';
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {Trip} from "../../types/trips.ts";
import {listTrips} from "../../lib";
import {useDisclosure} from "@mantine/hooks";

export const MyTrips = () => {

  const navigate = useNavigate();
  const [visible, {close}] = useDisclosure(true);
  const [trips, setTrips] = useState<Trip[]>([])
  useEffect(() => {
    listTrips().then(myTrips => {
      setTrips(myTrips);
      close();
    })
  }, [close])

  const cards = trips.map((trip) => (
    <Card key={trip.name} p="md" radius="md" component="a" href="#" className={classes.card} onClick={(event) => {
      navigate(`/trips/${trip.id}`)
      event.preventDefault()
    }}>
      <AspectRatio ratio={1920 / 1080}>
        {trip.coverImage && <Image src={trip.coverImage}/>}
        {!trip.coverImage &&
            <ActionIcon variant="subtle" bd={"solid 1px blue"} aria-label="Settings" style={{height: '100%'}}>
                <IconPhoto stroke={1.5}/>
            </ActionIcon>}
      </AspectRatio>
      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
        {new Date(Date.parse(trip.startDate.toString())).toLocaleDateString(
          'en-us',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
      </Text>
      <Text className={classes.title} mt={5}>
        {trip.name}
      </Text>
    </Card>
  ));

  const createNew = (
    <Card key={"create_new"} p="md" radius="md" component="a" href="#" className={classes.card} onClick={(event) => {
      navigate("/trips/create")
      event.preventDefault()
    }}>
      <AspectRatio ratio={1920 / 1080}>
        <ActionIcon variant="filled" aria-label="Settings" style={{height: '100%'}}>
          <IconPlus stroke={1.5}/>
        </ActionIcon>
      </AspectRatio>
      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
        {"Near Future"}
      </Text>
      <Text className={classes.title} mt={5}>
        {"Start An Amazing Adventure"}
      </Text>
    </Card>)

  return (
    <Container py="xl">
      <Text size="xl" tt="uppercase" fw={700} mt="md" mb="md">
        My Trips
      </Text>
      <SimpleGrid cols={{base: 1, sm: 2, md: 3}}>{[createNew]}</SimpleGrid>
      <Divider/>
      <SimpleGrid cols={{base: 1, sm: 2, md: 3}}>
        <LoadingOverlay visible={visible} zIndex={1000} overlayProps={{radius: "sm", blur: 2}}/>
        {cards}
      </SimpleGrid>
    </Container>
  );
}