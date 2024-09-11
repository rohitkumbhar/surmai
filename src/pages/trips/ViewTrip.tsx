import {useParams} from "react-router-dom";
import {Container, Group, LoadingOverlay, rem, Tabs, Text} from "@mantine/core";
import classes from './ViewTrip.module.css';
import {
  Icon24Hours,
  IconBuildingCottage,
  IconInfoSquare,
  IconNote,
  IconPlane,
  IconReportMoney
} from "@tabler/icons-react";
import {Trip} from "../../types/trips.ts";
import {formatDate, getTrip} from "../../lib";
import {Header} from "../../components/nav/Header.tsx";
import {BasicInfo} from "../../components/trip/BasicInfo.tsx";
import {useQuery} from "@tanstack/react-query";
import {Transportation} from "../../components/trip/Transportation.tsx";

export const ViewTrip = () => {

  const {tripId} = useParams();
  // const [trip, setTrip] = useState<Trip>()

  const {isPending, isError, data, error, refetch} = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId || ''),
  })


  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{radius: "sm", blur: 2}}/>
  }

  if(isError) {
    throw new Error(error.message)
  }


  const trip = data;


  const iconStyle = {width: rem(20), height: rem(20)};
  return (
    <Container py={"xl"} size="lg">
     <Header>
       <Group>
         <Text size={"xl"} px={"md"}>{trip?.name}</Text>
         <Text size={"sm"} c={"dimmed"}>{formatDate(trip.startDate.toString())} - {formatDate(trip.endDate.toString())}</Text>
       </Group>
     </Header>
      <Tabs
        defaultValue="basic"
        variant="outline"
        classNames={{
          root: classes.tabs,
          list: classes.tabsList,
          tab: classes.tab,
        }}
      >
        <Tabs.List>
          <Tabs.Tab value={"basic"} key={"basic"} leftSection={<IconInfoSquare style={iconStyle}/>}>
            Basic
          </Tabs.Tab>

          <Tabs.Tab value={"transportation"} key={"transportation"} leftSection={<IconPlane style={iconStyle}/>}>
            Transportation
          </Tabs.Tab>

          <Tabs.Tab value={"lodging"} key={"lodging"} leftSection={<IconBuildingCottage style={iconStyle}/>}>
            Lodging
          </Tabs.Tab>

          <Tabs.Tab value={"itinerary"} key={"itinerary"} leftSection={<Icon24Hours style={iconStyle}/>}>
            Itinerary
          </Tabs.Tab>

          <Tabs.Tab value={"cost"} key={"cost"} leftSection={<IconReportMoney style={iconStyle}/>}>
            Cost
          </Tabs.Tab>

          <Tabs.Tab value={"notes"} key={"notes"} leftSection={<IconNote style={iconStyle}/>}>
            Notes
          </Tabs.Tab>

        </Tabs.List>
        <Tabs.Panel value={"basic"}>
          {trip && <BasicInfo trip={trip} refetch={refetch} />}
        </Tabs.Panel>

        <Tabs.Panel value={"transportation"}>
          {trip && <Transportation trip={trip} refetch={refetch} />}
        </Tabs.Panel>

        <Tabs.Panel value={"lodging"}>
          Lodging Content
        </Tabs.Panel>

        <Tabs.Panel value={"itinerary"}>
          Itinerary Content
        </Tabs.Panel>

        <Tabs.Panel value={"cost"}>
          Cost Content
        </Tabs.Panel>

        <Tabs.Panel value={"notes"}>
          Notes Content
        </Tabs.Panel>

      </Tabs>
    </Container>
  )
}