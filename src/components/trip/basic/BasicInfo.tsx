import {CreateTripForm, Trip} from "../../../types/trips.ts";
import {Avatar, Button, Container, Divider, Flex, Group, Paper, Stack, Text, Title} from "@mantine/core";
import {QueryObserverResult, RefetchOptions, Register} from "@tanstack/react-query";
import {useState} from "react";
import {useForm} from "@mantine/form";
import {EditTripBasicForm} from "./EditTripBasicForm.tsx";
import {updateTrip} from "../../../lib";
import {formatDate} from "../../../lib";
import {IconPhoto} from "@tabler/icons-react";
import {basicInfoFormValidation} from "./validation.ts";
import {useTranslation} from "react-i18next";

const BasicInfoView = ({trip}: { trip: Trip }) => {

  const {t} = useTranslation();

  return (<Stack gap={"md"}>
    <Title order={1}>{trip.name}</Title>
    <Title order={4} fw={400}> {trip.description}</Title>
    <Text size={"sm"}>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</Text>

    <Divider/>
    <Text mt={"md"}>{t('basic.visiting', 'Visiting')}</Text>
    <Group>
      {(trip.destinations || []).map(destination => {
        return (
          <Group wrap={"nowrap"} key={destination.toString()}>
            <Paper shadow="sm" radius="sm" p="xl" bg={"var(--mantine-color-blue-0)"}>
              <IconPhoto/>
              <Text>{destination.name}</Text>
            </Paper>
          </Group>)
      })}
    </Group>
    <Divider/>
    <Text mt={"md"}>Going With</Text>
    <Group>
      {(trip.participants || []).map(person => {
        return (<Group wrap={"nowrap"} key={person.toString()}>
          <Avatar key={person.name} name={person.name} color="initials"/>
          <div>
            <Text fz="lg" fw={500}>
              {person.name}
            </Text>
          </div>
        </Group>)
      })}
    </Group>

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

  const initialValues: CreateTripForm = {
    name: trip.name,
    description: trip.description,
    dateRange: [new Date(Date.parse(trip.startDate.toString())), new Date(Date.parse(trip.endDate.toString()))],
    destinations: trip.destinations?.map(item => item.name),
    participants: trip.participants?.map(item => item.name)
  };

  const form = useForm<CreateTripForm>({
    mode: 'uncontrolled',
    initialValues: initialValues,
    validate: basicInfoFormValidation,
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
    })}>
      <EditTripBasicForm form={form}/>
      <Group justify={"flex-end"}>
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