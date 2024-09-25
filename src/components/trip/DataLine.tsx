import {ActionIcon, Group, Menu, Paper, rem} from "@mantine/core";
import {IconDots, IconPencil, IconTrash} from "@tabler/icons-react";
import {useState} from "react";
import {useTranslation} from "react-i18next";

export const DataLine = ({children, onEdit, onDelete}: {
  children: React.ReactNode,
  onEdit?: () => void,
  onDelete?: () => void
}) => {

  const [, setMenuOpened] = useState(false);
  const {t} = useTranslation()

  return (
    <Paper withBorder pos={"relative"}>
      <Group pos={"absolute"} right={"5px"} top={"2px"}>
        <Menu position="bottom-start"
              onClose={() => setMenuOpened(false)}
              onOpen={() => setMenuOpened(true)}>
          <Menu.Target>
            <ActionIcon variant={"transparent"} p={"2px"}>
              <IconDots title={t('menu', "Menu")}/>
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {onEdit && <Menu.Item
              onClick={onEdit}
              leftSection={
                <IconPencil style={{width: rem(16), height: rem(16)}} stroke={1.5}/>
              }
            >
              {t('edit', 'Edit')}
            </Menu.Item>}

            {onDelete && <Menu.Item
              onClick={onDelete}
              leftSection={
                <IconTrash style={{width: rem(16), height: rem(16)}} stroke={1.5}/>
              }
            >
              {t('delete', 'Delete')}
            </Menu.Item>}
          </Menu.Dropdown>
        </Menu>
      </Group>
      {children}
    </Paper>)

}