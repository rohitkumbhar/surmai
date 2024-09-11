import {Trip} from "../../types/trips.ts";
import {Button, Container, Flex, Group, Stack, Text, Title} from "@mantine/core";
import {QueryObserverResult, RefetchOptions, Register} from "@tanstack/react-query";
import {useState} from "react";
import {useForm} from "@mantine/form";
import {EditTripBasicForm} from "./EditTripBasicForm.tsx";
import {updateTrip} from "../../lib/pocketbase/trips.ts";

const BasicInfoView = ({trip}: { trip: Trip }) => {
  return (<Stack gap={"md"}>
    <Title order={1}>{trip.name}</Title>
    <Text>{trip.description}</Text>
  </Stack>)
}

interface EditBasicViewProps {
  trip: Trip,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Trip, Register extends {
    defaultError: infer TError
  } ? TError : Error>>,
  onSave: () => void
}

const EditBasicView = ({trip, refetch, onSave}: EditBasicViewProps) => {

  const initialValues = {
    name: trip.name,
    description: trip.description,
    dateRange: [new Date(Date.parse(trip.startDate.toString())), new Date(Date.parse(trip.endDate.toString()))],
    destinations: trip.destinations?.map(item => item.name),
    participants: trip.participants?.map(item => item.name)
  };

  console.log("initial values", initialValues)

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: initialValues,
    validate: {},
  });


  return (
    <form onSubmit={form.onSubmit((values) => {
      const data = {
        name: values.name,
        description: values.description,
        startDate: values.dateRange[0],
        endDate: values.dateRange[1],
        destinations: values.destinations?.map(name => {
          return {name: name}
        }),
        participants: values.participants?.map(name => {
          return {name: name}
        })
      }
      updateTrip(trip.id, data).then(() => {
        refetch()
        onSave()
      })
      0
      console.log("Editing with values", values)

    })}>
      <EditTripBasicForm form={form}/>
      <Group>
        <Button mt="xl" type={"submit"}>
          Save
        </Button>
      </Group>
    </form>

  )

}

export const BasicInfo = ({trip, refetch}: {
  trip: Trip,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Trip, Register extends {
    defaultError: infer TError
  } ? TError : Error>>
}) => {

  const [editMode, setEditMode] = useState<boolean>(false);

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
        {!editMode && <Button variant="filled" onClick={() => setEditMode(true)}>Edit</Button>}
        {editMode && <Button variant="filled" onClick={() => setEditMode(false)}>Cancel</Button>}

        <Button variant="filled" bg={"red"}>Delete</Button>

      </Flex>

      {!editMode && <BasicInfoView trip={trip}/>}
      {editMode && <EditBasicView trip={trip} refetch={refetch} onSave={() => setEditMode(false)}/>}


    </Container>
  )
}