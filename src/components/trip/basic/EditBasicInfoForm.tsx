import {CreateTripForm, Trip} from "../../../types/trips.ts";
import {useTranslation} from "react-i18next";
import {useForm} from "@mantine/form";
import {basicInfoFormValidation} from "./validation.ts";
import {updateTrip} from "../../../lib";
import {EditTripBasicForm} from "./EditTripBasicForm.tsx";
import {Button, Group} from "@mantine/core";
import {ContextModalProps} from "@mantine/modals";

export const EditBasicInfoForm = ({context, id, innerProps}: ContextModalProps<{
  trip: Trip,
  onSave: () => void,
  onSuccess? : () => void,
  onCancel? : () => void,
}
>) => {

  const {trip, onSave} = innerProps
  const {t} = useTranslation()
  const initialValues: CreateTripForm = {
    name: trip.name,
    description: trip.description,
    dateRange: [trip.startDate, trip.endDate],
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
        context.closeModal(id)
        onSave()
      })
    })}>
      <EditTripBasicForm form={form}/>
      <Group justify={"flex-end"}>
        <Button mt="xl"  type={"button"} variant={"default"} w={"min-content"} onClick={() => {
          context.closeModal(id)
        }}>
          {t('cancel', "Cancel")}
        </Button>
        <Button mt="xl" type={"submit"}>
          {t('save', 'Save')}
        </Button>
      </Group>
    </form>
  )
}