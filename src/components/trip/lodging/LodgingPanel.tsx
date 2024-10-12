import {Lodging, Trip} from "../../../types/trips.ts";
import {useQuery} from "@tanstack/react-query";
import {listLodgings} from "../../../lib";
import {Container, Flex, LoadingOverlay, Stack, Title} from "@mantine/core";
import {AddLodgingMenu} from "./AddLodgingMenu.tsx";
import {Fragment} from "react";
import {useTranslation} from "react-i18next";
import {GenericLodgingData} from "./GenericLodgingData.tsx";


export const LodgingPanel = ({trip}: { trip: Trip }) => {

  const {t} = useTranslation()
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
        <AddLodgingMenu trip={trip} refetch={refetch}/>
      </Flex>
      {<Stack mt={"sm"}>
        <Title order={5}>{t('lodging.name', 'Lodging')}</Title>
        {data.map((t: Lodging) => {
          return (<Fragment key={t.id}>
            <GenericLodgingData refetch={refetch} trip={trip} lodging={t}/>
          </Fragment>)
        })}
      </Stack>
      }

    </Container>

  )
}