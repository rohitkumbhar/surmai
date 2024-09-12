import {Container, Flex, LoadingOverlay, Stack} from "@mantine/core";
import {Transportation, Trip} from "../../../types/trips.ts";
import {AddTransportationMenu} from "./AddTransportationMenu.tsx";
import {Fragment, useState} from "react";
import {AddFlightForm} from "./AddFlightForm.tsx";
import {useQuery} from "@tanstack/react-query";
import {listTransportations} from "../../../lib";
import {FlightData} from "./FlightData.tsx";


export const TransportationPanel = ({trip}: {
  trip: Trip,
}) => {

  const tripId = trip.id
  const [newOption, setNewOption] = useState<string>()
  const {isPending, isError, data, error, refetch} = useQuery<Transportation[]>({
    queryKey: ['listTransportations', tripId],
    queryFn: () => listTransportations(tripId || ''),
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
        {!newOption && <AddTransportationMenu setSelectedOption={(val) => {
          setNewOption(val)
        }}/>}
      </Flex>

      {newOption === 'flight' && <AddFlightForm trip={trip} onCancel={() => setNewOption(undefined)} onSuccess={() => {
        setNewOption(undefined)
        refetch()
      }}/>}

      <Stack mt={"sm"}>
        {data.map((t: Transportation) => {
          return (<Fragment key={t.id}>
            {t.type === "flight" && <FlightData refetch={refetch} trip={trip} flight={t}/>}
          </Fragment >)
        })}

      </Stack>


    </Container>)
}