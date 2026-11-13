import { Container } from '@mantine/core';

import { BasicInfoView } from '@src/components/trip/basic/BasicInfoView.tsx';

import type { Attachment, Trip } from '@src/types/trips.ts';

export const BasicInfo = ({ trip, refetch }: { trip: Trip; refetch: () => void; tripAttachments?: Attachment[] }) => {
  return (
    <Container py={'xs'} size="xl">
      <BasicInfoView trip={trip} refetch={refetch} />
    </Container>
  );
};
