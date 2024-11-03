import { Trip } from '../../../types/trips.ts';
import { Container } from '@mantine/core';
import {
  QueryObserverResult,
  RefetchOptions,
  Register,
} from '@tanstack/react-query';
import { BasicInfoView } from './BasicInfoView.tsx';

export const BasicInfo = ({
  trip,
  refetch,
}: {
  trip: Trip;
  refetch: (options?: RefetchOptions) => Promise<
    QueryObserverResult<
      Trip,
      Register extends {
        defaultError: infer TError;
      }
        ? TError
        : Error
    >
  >;
}) => {
  return (
    <Container py={'xs'} size="lg">
      <BasicInfoView trip={trip} refetch={refetch} />
    </Container>
  );
};
