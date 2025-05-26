import { Attachment, Trip } from '../../../types/trips.ts';
import { Container } from '@mantine/core';
import { BasicInfoView } from './BasicInfoView.tsx';

export const BasicInfo = ({ trip, refetch }: { trip: Trip; refetch: () => void; tripAttachments?: Attachment[] }) => {
  return (
    <Container py={'xs'} size="xl">
      <BasicInfoView trip={trip} refetch={refetch} />
    </Container>
  );
};
