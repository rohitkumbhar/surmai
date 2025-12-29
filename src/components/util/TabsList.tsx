import { ActionIcon, Divider, Group, Menu, Tabs, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

import { useSurmaiContext } from '../../app/useSurmaiContext';

export interface TabData {
  key: string;
  value: string;
}

export const TabsList = ({
  tabs,
  changeTabFn,
  activeTab,
}: {
  tabs: TabData[];
  activeTab: string;
  changeTabFn: (name: string) => void;
}) => {
  const { isMobile } = useSurmaiContext();

  return (
    <>
      {isMobile && (
        <>
          <Group justify="space-between">
            <Text>{tabs.find((t) => t.key === activeTab)?.value}</Text>
            <Menu>
              <Menu.Target>
                <ActionIcon variant="subtle" aria-label="Settings">
                  <IconChevronDown size={'sm'} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {tabs.map((tab) => {
                  return <Menu.Item onClick={() => changeTabFn(tab.key)}>{tab.value}</Menu.Item>;
                })}
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Divider mt='sm' />
        </>
      )}
      {!isMobile && (
        <Tabs.List>
          {tabs.map((tab) => {
            return (
              <Tabs.Tab key={tab.key} value={tab.key}>
                {tab.value}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      )}
    </>
  );
};
