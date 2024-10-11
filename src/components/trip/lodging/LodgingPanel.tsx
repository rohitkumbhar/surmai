import {Lodging, Trip} from "../../../types/trips.ts";
import {useQuery} from "@tanstack/react-query";
import {listLodgings} from "../../../lib";
import {Container, Flex, LoadingOverlay} from "@mantine/core";
import {AddLodgingMenu} from "./AddLodgingMenu.tsx";


export const LodgingPanel = ({trip}: { trip: Trip }) => {

  const tripId = trip.id
  const {isPending, isError, data, error, refetch} = useQuery<Lodging[]>({
    queryKey: ['listLodgings', tripId],
    queryFn: () => listLodgings(tripId || ''),
  })


  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{radius: "sm", blur: 2}}/>
  }

  if (isError) {
    throw new Error(error.message)
  }


  return (
    <Container py={"xs"} size="lg">
      <Flex
        mih={50}
        gap="md"
        justify="flex-end"
        align="center"
        direction="row"
        wrap="wrap"
      >
        <AddLodgingMenu trip={trip} refetch={refetch} />
      </Flex>
      {/*<Stack mt={"sm"}>
        <Title order={5}>{t('transportation.travel_timeline','Travel Timeline')}</Title>
        {data.filter(t => t.type !== 'rental_car').map((t: Transportation) => {
          return (<Fragment key={t.id}>
            {t.type === "flight" && <GenericTransportationData refetch={refetch} trip={trip} transportation={t}/>}
            {t.type === "rental_car" && <CarRentalData refetch={refetch} trip={trip} rental={t}/>}
            {t.type === "bus" && <GenericTransportationData refetch={refetch} trip={trip} transportation={t}/>}
            {t.type === "boat" && <GenericTransportationData refetch={refetch} trip={trip} transportation={t}/>}
            {t.type === "train" && <GenericTransportationData refetch={refetch} trip={trip} transportation={t}/>}
            {t.type === "car" && <GenericTransportationData refetch={refetch} trip={trip} transportation={t}/>}
          </Fragment>)
        })}
      </Stack>

     */}

    </Container>

  )
}