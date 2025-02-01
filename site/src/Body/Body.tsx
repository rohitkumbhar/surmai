import { Carousel } from '@mantine/carousel';
import { Button, Card, Container, Grid, Group, Image, List, SimpleGrid, Text, ThemeIcon, Title } from '@mantine/core';

import { IconCheck, IconCode, IconDeviceMobile, IconUser, IconWifiOff } from '@tabler/icons-react';
import classes from './Body.module.css';
import { CodeHighlightTabs } from '@mantine/code-highlight';

const features = [
  {
    icon: IconCode,
    title: 'Open source',
    description: 'Published under MIT license, you can fork and/or self host to your liking',
  },
  {
    icon: IconUser,
    title: 'Privacy First',
    description: 'No cookies, no tracking, no 3P data sharing, nada. The data lives with you.',
  },
  {
    icon: IconWifiOff,
    title: 'Available Offline',
    description: 'Sync data to your device to have it always available',
  },
  {
    icon: IconDeviceMobile,
    title: 'Responsive',
    description: 'Get the same experience on a mobile device compared to a desktop',
  },
];

const images = [
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/desktop_organization.png?raw=true',
    title: 'Desktop - Organization Expanded',
  },
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/desktop_home.png?raw=true',
    title: 'Desktop - Home',
  },
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/desktop_itinerary.png?raw=true',
    title: 'Desktop - Itinerary',
  },
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/desktop_admin_settings.png?raw=true',
    title: 'Desktop - Admin Settings',
  },
];

const mobileImages = [
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/mobile_home.png?raw=true',
    title: 'Mobile - Home',
  },
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/mobile_offline_ready.png?raw=true',
    title: 'Mobile - Offline Ready',
  },
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/mobile_organization.png?raw=true',
    title: 'Mobile - Organization',
  },
  {
    src: 'https://github.com/rohitkumbhar/surmai/blob/main/screenshots/mobile_user_profile.png?raw=true',
    title: 'Mobile - User Profile',
  },
];

export const Body = () => {
  const dockerCompose = `
volumes:
  surmai_data:

services:
  surmai_server:
    container_name: surmai_server
    # latest images point to released versions
    # For the yet unreleased updates, use the main tag i.e.
    # image: ghcr.io/rohitkumbhar/surmai:main
    image: ghcr.io/rohitkumbhar/surmai:latest
    volumes:
      - surmai_data:/pb_data
    ports:
      - "9090:8080"
    restart: always
    environment:
      SURMAI_ADMIN_EMAIL: admin@example.com # Add your default administrator email
      SURMAI_ADMIN_PASSWORD: ChangeMe123#@! # Admin password. Min 9 characters with all the fixings
      PB_DATA_DIRECTORY: /pb_data # Must match volume directory above
`;

  const items = features.map((feature) => (
    <div key={feature.title}>
      <ThemeIcon size={44} radius="md">
        <feature.icon size={26} stroke={1.5} />
      </ThemeIcon>
      <Text fz="lg" mt="sm" fw={500}>
        {feature.title}
      </Text>
      <Text c="dimmed" fz="sm">
        {feature.description}
      </Text>
    </div>
  ));

  return (
    <Container size={'lg'} p={'lg'}>
      <div className={classes.wrapper}>
        <Grid gutter={80}>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title className={classes.title} order={2}>
              Surmai is a personal/family travel organizer
            </Title>
            <Text c="dimmed">
              The app is built to solve 3 particular challenges while planning a trip
              <List
                mt={30}
                spacing="sm"
                size="md"
                icon={
                  <ThemeIcon size={20} radius="xl">
                    <IconCheck size={12} stroke={1.5} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  Allow <b>collaborative planning</b> between multiple people.
                </List.Item>
                <List.Item>
                  Allow <b>easy access to all the necessary artifacts</b> during the course of the trip.
                </List.Item>
                <List.Item>
                  Keep the data <b>private</b>.
                </List.Item>
              </List>
            </Text>

            <Group>
              <Button
                component={'a'}
                href={'https://github.com/rohitkumbhar/surmai'}
                target={'_blank'}
                size="lg"
                radius="md"
                mt="xl"
              >
                View Source Code
              </Button>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={30}>
              {items}
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </div>

      <Card mt={'xl'}>
        <Card.Section withBorder>
          <Group justify="space-between">
            <Title order={2}>Docker Compose</Title>
          </Group>
        </Card.Section>
        <Card.Section withBorder>
          <CodeHighlightTabs code={[{ fileName: 'docker-compose.yaml', code: dockerCompose, language: 'yaml' }]} />
        </Card.Section>
      </Card>

      <Card mt={'xl'}>
        <Card.Section withBorder>
          <Group justify="space-between">
            <Title order={2}>Screenshots</Title>
          </Group>
        </Card.Section>
        <Card.Section inheritPadding mt="sm" pb="md">
          <Title order={5}>Desktop</Title>
          <Carousel
            slideSize={{ base: '100%', sm: '50%' }}
            slideGap={{ base: 2, sm: 'xl' }}
            align="start"
            slidesToScroll={1}
          >
            {images.map((image) => (
              <Carousel.Slide key={image.src}>
                <Image src={image.src} alt={image.title} />
                <Text>{image.title}</Text>
              </Carousel.Slide>
            ))}
          </Carousel>

          <Title mt={'xl'} order={5}>
            Mobile
          </Title>
          <Carousel
            slideSize={{ base: '100%', sm: '50%' }}
            slideGap={{ base: 2, sm: 'xl' }}
            align="start"
            slidesToScroll={1}
          >
            {mobileImages.map((image) => (
              <Carousel.Slide key={image.src}>
                <Text>{image.title}</Text>
                <Image src={image.src} alt={image.title} />
              </Carousel.Slide>
            ))}
          </Carousel>
        </Card.Section>
      </Card>
    </Container>
  );
};
