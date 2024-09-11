import {Trip} from "../../types/trips.ts";
import {Container, Text} from "@mantine/core";
import {EditableText} from "../editable/EditableText.tsx";
import {QueryObserverResult, RefetchOptions, Register} from "@tanstack/react-query";
import {updateTrip} from "../../lib/pocketbase/trips.ts";

export const BasicInfo = ({trip, refetch}: {
  trip: Trip,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Trip, Register extends {
    defaultError: infer TError
  } ? TError : Error>>
}) => {

  return (
    <Container py={"xs"} size="lg">


      <EditableText text={trip.name}
                    label={"Name"}
                    multiline={false}
                    validate={() => null}
                    onChange={(newValue: string) => {
                      updateTrip(trip.id, {name: newValue}).then(() => {
                        refetch();
                      })
                    }}>
        <h1>{trip.name}</h1>
      </EditableText>

      <EditableText text={trip.description}
                    label={"Description"}
                    multiline={true}
                    validate={() => null}
                    onChange={(newValue: string) => {
                      updateTrip(trip.id, {description: newValue}).then(() => {
                        refetch();
                      })
                    }}>
        <Text>{trip.description}</Text>
      </EditableText>
    </Container>
  )
}