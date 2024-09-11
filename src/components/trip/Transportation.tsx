import {Container, Flex, Group, Stack, TextInput} from "@mantine/core";
import {Trip} from "../../types/trips.ts";
import {QueryObserverResult, RefetchOptions, Register} from "@tanstack/react-query";
import {AddTransportationMenu} from "../ButtonMenu/AddTransportationMenu.tsx";
import {useState} from "react";
import {DateTimePicker} from "@mantine/dates";


export const Transportation = ({trip, refetch}: {
  trip: Trip,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Trip, Register extends {
    defaultError: infer TError
  } ? TError : Error>>
}) => {

  const [newOption, setNewOption] = useState<string>()


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
          setNewOption(val)
        }}/>
      </Flex>

      <Stack>
        <Group gap={"md"} grow >
          <Group grow>
            <TextInput name={"from"} label={"From"} />
            <DateTimePicker name={"departureTime"} label={"Departure Time"}/>
          </Group>
          <Group grow>
            <TextInput name={"to"} label={"To"} />
            <DateTimePicker name={"arrivalTime"} label={"Arrival Time"} />
          </Group>
        </Group>
        <Group gap={"md"} grow >
          <TextInput name={"airline"} label={"Airline"} />
          <TextInput name={"flightNo"} label={"Flight Number"} />
          <TextInput name={"confirmationCode"} label={"Confirmation Code"} />
        </Group>
      </Stack>

    </Container>)
}