import { IconPencil, IconPhoto } from '@tabler/icons-react';
import { ActionIcon, AspectRatio, Badge, Card, Group, Image, Overlay, Text } from '@mantine/core';
import classes from './TripCard.module.css';
import { Trip } from '../../types/trips.ts';
import { getAttachmentUrl, uploadTripCoverImage } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useHover, useMediaQuery } from '@mantine/hooks';
import { openContextModal } from '@mantine/modals';
import { useState } from 'react';
import dayjs from 'dayjs';

export function TripCard({ trip, onSave }: { trip: Trip; onSave: () => void }) {
  const navigateFunction = useNavigate();
  const { hovered, ref } = useHover();
  const { id, name, coverImage, destinations } = trip;
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [tripCoverImage, setTripCoverImage] = useState<string | undefined>(coverImage);

  const destinationBadge = destinations?.map((destination) => (
    <Badge variant="light" key={destination.id || nanoid()}>
      {destination.name}
    </Badge>
  ));

  return (
    <Card
      withBorder
      radius={'md'}
      p={'md'}
      className={classes.card}
      onClick={(event) => {
        navigateFunction(`/trips/${id}`);
        event.preventDefault();
      }}
    >
      <Card.Section>
        <AspectRatio ratio={1920 / 800} pos="relative" ref={ref}>
          {tripCoverImage && (
            <Image
              src={getAttachmentUrl(trip, tripCoverImage, { thumb: '300x125' })}
              alt={'Cover Image'}
              fit={'cover'}
            />
          )}
          {!tripCoverImage && (
            <ActionIcon variant={'light'} aria-label={'Trip Details'} style={{ height: '100%' }}>
              <IconPhoto stroke={1.5} />
            </ActionIcon>
          )}
          {hovered && (
            <Overlay color="#000" backgroundOpacity={0.05}>
              <ActionIcon
                variant={'filled'}
                title={t('edit_cover_image', 'Edit Cover Image')}
                style={{ height: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openContextModal({
                    modal: 'uploadImageForm',
                    title: t('trip_add_cover_image', 'Add Cover Image'),
                    radius: 'md',
                    withCloseButton: false,
                    size: 'auto',
                    fullScreen: isMobile,
                    innerProps: {
                      aspectRatio: 1920 / 800,
                      saveUploadedImage: (uploadedImage: File | Blob) => {
                        uploadTripCoverImage(trip.id, uploadedImage).then((result) => {
                          setTripCoverImage(result.coverImage);
                          onSave();
                        });
                      },
                    },
                  });
                }}
              >
                <IconPencil stroke={1} />
              </ActionIcon>
            </Overlay>
          )}
        </AspectRatio>
      </Card.Section>

      <Card.Section className={classes.section} mt="md">
        <Group justify="apart">
          <Text fz="md" fw={'bold'}>
            {name}
          </Text>
        </Group>
        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
          {`${dayjs(trip.startDate).format('LL')} - ${dayjs(trip.endDate).format('LL')}`}
        </Text>
      </Card.Section>

      <Card.Section className={classes.section}>
        <Group gap={7} mt={'md'}>
          {destinationBadge}
        </Group>
      </Card.Section>
    </Card>
  );
}
