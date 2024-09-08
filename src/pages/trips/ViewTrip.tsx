import {useParams} from "react-router-dom";
import {Container, rem, Tabs} from "@mantine/core";
import classes from './ViewTrip.module.css';
import {
  Icon24Hours,
  IconBaseline,
  IconBuildingCottage,
  IconNote,
  IconPlane,
  IconReportMoney
} from "@tabler/icons-react";
import {useEffect} from "react";

export const ViewTrip = () => {

  const { tripId } = useParams();
  useEffect(() => {

  },[tripId])


  const iconStyle = { width: rem(20), height: rem(20) };
  return (
    <Container size="lg">
      <Tabs
        defaultValue="basic"
        variant="outline"
        classNames={{
          root: classes.tabs,
          list: classes.tabsList,
          tab: classes.tab,
        }}
      >
        <Tabs.List>
          <Tabs.Tab value={"basic"} key={"basic"} leftSection={<IconBaseline style={iconStyle} />}>
            Basic
          </Tabs.Tab>

          <Tabs.Tab value={"transportation"} key={"transportation"} leftSection={<IconPlane style={iconStyle} />}>
            Transportation
          </Tabs.Tab>

          <Tabs.Tab value={"lodging"} key={"lodging"} leftSection={<IconBuildingCottage style={iconStyle} />}>
            Lodging
          </Tabs.Tab>

          <Tabs.Tab value={"itinerary"} key={"itinerary"} leftSection={<Icon24Hours style={iconStyle} />}>
            Itinerary
          </Tabs.Tab>

          <Tabs.Tab value={"cost"} key={"cost"} leftSection={<IconReportMoney style={iconStyle} />}>
            Cost
          </Tabs.Tab>

          <Tabs.Tab value={"notes"} key={"notes"} leftSection={<IconNote style={iconStyle} />}>
            Notes
          </Tabs.Tab>

        </Tabs.List>
        <Tabs.Panel value={"basic"}>
          Basic Settings
        </Tabs.Panel>

        <Tabs.Panel value={"transportation"}>
          Transportation Content
        </Tabs.Panel>

        <Tabs.Panel value={"lodging"}>
          Lodging Content
        </Tabs.Panel>

        <Tabs.Panel value={"itinerary"}>
          Itinerary Content
        </Tabs.Panel>

        <Tabs.Panel value={"cost"}>
          Cost Content
        </Tabs.Panel>

        <Tabs.Panel value={"notes"}>
          Notes Content
        </Tabs.Panel>

      </Tabs>
    </Container>
  )
}