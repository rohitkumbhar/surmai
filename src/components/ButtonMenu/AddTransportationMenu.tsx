import {Button, Menu, rem} from '@mantine/core';
import {IconBus, IconCar, IconChevronDown, IconPlane, IconShip,} from '@tabler/icons-react';



export const AddTransportationMenu = ({setSelectedOption} : { setSelectedOption: (val: string) => void}) => {
  return (
    <Menu
      transitionProps={{transition: 'pop-top-right'}}
      position="bottom-end"
      width={150}
      withinPortal

    >
      <Menu.Target>
        <Button
          rightSection={
            <IconChevronDown style={{width: rem(18), height: rem(18)}} stroke={1.5}/>
          }
          pr={12}
        >
          Add new
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            setSelectedOption('flight')
          }}
          leftSection={
            <IconPlane
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          Flight
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            setSelectedOption('bus')
          }}
          leftSection={
            <IconBus
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          Bus
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            setSelectedOption('road')
          }}
          leftSection={
            <IconCar
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          Car / Taxi
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            setSelectedOption('boat')
          }}
          leftSection={
            <IconShip
              style={{width: rem(16), height: rem(16)}}
              stroke={1.5}
            />
          }
        >
          Boat ride
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}