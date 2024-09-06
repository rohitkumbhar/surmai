import {useParams} from "react-router-dom";
import {Container, Tabs} from "@mantine/core";
import classes from './ViewTrip.module.css';
export const ViewTrip = () => {

  const { tripId } = useParams();

  console.log("tripId =>", tripId)
  const tabs = [
    'Home',
    'Orders',
    'Education',
    'Community',
    'Forums',
    'Support',
    'Account',
    'Helpdesk',
  ];

  const items = tabs.map((tab) => (
    <Tabs.Tab value={tab} key={tab}>
      {tab}
    </Tabs.Tab>
  ));

  return (
    <Container size="md">
      <Tabs
        defaultValue="Home"
        variant="outline"
        visibleFrom="sm"
        classNames={{
          root: classes.tabs,
          list: classes.tabsList,
          tab: classes.tab,
        }}
      >
        <Tabs.List>{items}</Tabs.List>
      </Tabs>
    </Container>
  )
}