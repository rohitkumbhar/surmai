import {ActionIcon, AspectRatio, Card, Container, Image, SimpleGrid, Text} from '@mantine/core';
import classes from './MyTrips.module.css';
import {IconPlus,} from '@tabler/icons-react';
import {useNavigate} from "react-router-dom";

export const MyTrips = () => {

  const navigate = useNavigate();

  const mockdata = [
    {
      title: 'Top 10 places to visit in Norway this summer',
      image:
        'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
      date: 'August 18, 2022',
    },
    {
      title: 'Best forests to visit in North America',
      image:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
      date: 'August 27, 2022',
    },
    {
      title: 'Hawaii beaches review: better than you think',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
      date: 'September 9, 2022',
    },
    {
      title: 'Mountains at night: 12 best locations to enjoy the view',
      image:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
      date: 'September 12, 2022',
    },
  ];

  const cards = mockdata.map((article) => (
    <Card key={article.title} p="md" radius="md" component="a" href="#" className={classes.card} onClick={(event) => {
      navigate("/trips/foo")
      event.preventDefault()
    }}>
      <AspectRatio ratio={1920 / 1080}>
        <Image src={article.image}/>
      </AspectRatio>
      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
        {article.date}
      </Text>
      <Text className={classes.title} mt={5}>
        {article.title}
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
      <SimpleGrid cols={{base: 1, sm: 2, md: 3}}>{[createNew, ...cards]}</SimpleGrid>
    </Container>
  );
}