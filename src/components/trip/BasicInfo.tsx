import {Trip} from "../../types/trips.ts";
import {Container, Overlay, Text} from "@mantine/core";
import {useHover} from "@mantine/hooks";

export const BasicInfo = ({trip}: { trip: Trip }) => {

  const { hovered, ref } = useHover();
  return (
    <Container py={"xs"} size="lg">
      <h1>{trip.name}</h1>
      <Text ref={ref} component="span" variant="gradient" gradient={{from: 'blue', to: 'cyan'}} c={"dimmed"} size={"xs"} inherit>
        {trip.description}
      </Text>
      {hovered &&  <Overlay color="#000" backgroundOpacity={0.85} />}
    </Container>
  )
}