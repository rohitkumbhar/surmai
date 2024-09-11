import {Container, Flex} from "@mantine/core";
import {Trip} from "../../types/trips.ts";
import {QueryObserverResult, RefetchOptions, Register} from "@tanstack/react-query";
import {AddTransportationMenu} from "../ButtonMenu/AddTransportationMenu.tsx";


export const Transportation = ({trip, refetch}: {
  trip: Trip,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Trip, Register extends {
    defaultError: infer TError
  } ? TError : Error>>
}) => {
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
        <AddTransportationMenu setSelectedOption={(val) => {
          console.log("Selected =>", val)
        }}/>
      </Flex>



    </Container>)
}