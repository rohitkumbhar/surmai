import {Participant, Trip} from "../../../types/trips.ts";
import {Avatar, Box, Checkbox, Group, Indicator, Paper, Popover, Text, TextInput} from "@mantine/core";
import {forwardRef, useState} from "react";
import {IconChevronDown} from "@tabler/icons-react";
import {useForm} from "@mantine/form";
import {updateTrip} from "../../../lib";

const ParticipantButton = forwardRef<HTMLDivElement, { name: string, email?: string }>((props, ref) => {
  const {name, email} = props
  return (
    <div ref={ref}>
      <Paper shadow={"sm"} p={"xs"} bd={"1px solid var(--mantine-primary-color-2)"}>
        <Group>
          <Avatar key={name} name={name} color="initials"/>
          <div>
            <Text fz="md" fw={500}>
              {name}
            </Text>
            <Text fz="xs" c="dimmed">
              {email || 'No e-mail'}
            </Text>
          </div>
          <IconChevronDown stroke={1}/>
        </Group>
      </Paper>
    </div>
  )

});

export const ParticipantData = ({participant, trip, index, refetch}: {
  participant: Participant,
  trip: Trip,
  index: number,
  refetch: () => void
}) => {

  const {name, email, collaborator} = participant
  const [participantEmail, setParticipantEmail] = useState<string | undefined>(participant.email)
  const [isCollaborator, setCollaborator] = useState<boolean | undefined>(participant.collaborator)

  const form = useForm<{ email?: string, collaborator?: boolean }>(
    {
      mode: 'uncontrolled',
      initialValues: {
        email: email,
        collaborator: collaborator
      },
      validate: {
        collaborator: (value, values) => {
          if (value && (!values.email || values.email === '')) {
            return "An email is required for a collaborator"
          }
          return null
        }
      }
    }
  )

  const handleSubmit = (values: { email?: string, collaborator?: boolean }) => {
    setParticipantEmail(values.email)
    setCollaborator(values.collaborator)

    const data = {...trip}

    if (data.participants && data.participants[index]) {
      const updatedParticipant = data.participants[index];
      updatedParticipant.collaborator = values.collaborator;
      updatedParticipant.email = values.email;

      // getUserByEmail(values.email || '').then(user => {
      //   console.log("User found", user)
      // }).catch(err => {
      //   console.log("Error", err)
      // })
      updateTrip(trip.id, data).then(() => {
        refetch()
      })
    }
  }

  return (

    <Popover width={300} trapFocus position="bottom" withArrow shadow="md" onClose={() => {
      if (form.isDirty()) {
        handleSubmit(form.getValues())
      }
    }}>
      <Popover.Target>
        <Box>
          {isCollaborator &&
            <Indicator position={"top-start"}><ParticipantButton name={name} email={participantEmail}/></Indicator>}
          {!isCollaborator && <ParticipantButton name={name} email={participantEmail}/>}
        </Box>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput type={"email"} label="Email" size="sm" mt="xs"
                     key={form.key('email')}
                     {...form.getInputProps('email')} />
          <Checkbox label={"Collaborator"} size="sm" mt="sm"
                    key={form.key('collaborator')}
                    {...form.getInputProps('collaborator', {type: 'checkbox'})}/>
        </form>
      </Popover.Dropdown>
    </Popover>


  )
}