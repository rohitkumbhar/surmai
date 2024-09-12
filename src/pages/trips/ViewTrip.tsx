import {useParams} from "react-router-dom";
import {Accordion, Container, Group, LoadingOverlay, rem, Text} from "@mantine/core";
import {IconBed, IconInfoSquare, IconPlane} from "@tabler/icons-react";
import {Trip} from "../../types/trips.ts";
import {formatDate, getTrip} from "../../lib";
import {Header} from "../../components/nav/Header.tsx";
import {BasicInfo} from "../../components/trip/basic/BasicInfo.tsx";
import {useQuery} from "@tanstack/react-query";
import {TransportationPanel} from "../../components/trip/transportation/TransportationPanel.tsx";

export const ViewTrip = () => {

  const {tripId} = useParams();
  const {isPending, isError, data, error, refetch} = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId || ''),
  })


  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{radius: "sm", blur: 2}}/>
  }

  if (isError) {
    throw new Error(error.message)
  }
  const trip = data;
  return (
    <Container py={"xl"} size="lg">
      <Header>
        <Group>
          <Text size={"xl"} px={"md"}>{trip?.name}</Text>
          <Text size={"sm"}
                c={"dimmed"}>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</Text>
        </Group>
      </Header>

      <Accordion chevronPosition="right" variant="separated">
        <Accordion.Item value={"basic_info"} key={"basic_info"}>
          <Accordion.Control icon={
            <IconInfoSquare
              style={{color: 'var(--mantine-color-blue-6', width: rem(40), height: rem(40)}}
            />
          }>
            <Group wrap="nowrap">
              <div>
                <Text>{"Basic Information"}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {"View basic information about your trip"}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <BasicInfo trip={trip} refetch={refetch}/>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={"transportation"} key={"transportation"}>
          <Accordion.Control icon={
            <IconPlane
              style={{color: 'var(--mantine-color-blue-6', width: rem(40), height: rem(40)}}
            />
          }>
            <Group wrap="nowrap">
              <div>
                <Text>{"Transportation"}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {"View and edit your transportation arrangements for this trip"}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <TransportationPanel trip={trip} refetch={refetch}/>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={"lodging"} key={"lodging"}>
          <Accordion.Control icon={
            <IconBed
              style={{color: 'var(--mantine-color-blue-6', width: rem(40), height: rem(40)}}
            />
          }>
            <Group wrap="nowrap">
              <div>
                <Text>{"Lodging"}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {"View and edit your lodging arrangements for this trip"}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <TransportationPanel trip={trip}/>
          </Accordion.Panel>
        </Accordion.Item>

      </Accordion>


    </Container>
  )
}