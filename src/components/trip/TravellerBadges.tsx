import { Badge, Divider, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';

import { TravellerProfileModal } from '../traveller/TravellerProfileModal.tsx';

import type { TravellerProfile } from '../../types/trips.ts';

export const TravellerBadges = ({
  travellerIds,
  tripTravellers,
}: {
  travellerIds?: string[];
  tripTravellers: TravellerProfile[];
}) => {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [selectedProfile, setSelectedProfile] = useState<TravellerProfile | null>(null);

  if (!travellerIds || travellerIds.length === 0) {
    return null;
  }

  const travellers = tripTravellers.filter((t) => travellerIds.includes(t.id));

  if (travellers.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
      <Group gap="xs" px="xs" pb="xs" mt={'sm'}>
        {travellers.map((traveller) => (
          <Badge
            key={traveller.id}
            variant="outline"
            radius={'xs'}
            size="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedProfile(traveller);
              openModal();
            }}
          >
            {traveller.legalName}
          </Badge>
        ))}
      </Group>

      {selectedProfile && <TravellerProfileModal profile={selectedProfile} opened={modalOpened} onClose={closeModal} />}
    </>
  );
};
