import { ActionIcon, Group, Menu, Paper, rem } from '@mantine/core';
import { IconDots, IconLink, IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const DataLine = ({
  children,
  onEdit,
  onDelete,
  link = undefined,
}: {
  link: string | undefined;
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const [, setMenuOpened] = useState(false);
  const { t } = useTranslation();

  return (
    <Paper withBorder pos={'relative'}>
      <Group pos={'absolute'} right={'5px'} top={'2px'}>
        <Menu position="bottom-start" onClose={() => setMenuOpened(false)} onOpen={() => setMenuOpened(true)}>
          <Menu.Target>
            <ActionIcon variant={'transparent'} p={'2px'}>
              <IconDots title={t('menu', 'Menu')} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {link && (
              <Link to={link} style={{textDecoration: 'none'}} target='_blank'>
                <Menu.Item leftSection={<IconLink style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
                  {t('view_link', 'View Link')}
                </Menu.Item>
              </Link>
            )}
            {onEdit && (
              <Menu.Item
                onClick={onEdit}
                leftSection={<IconPencil style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
              >
                {t('edit', 'Edit')}
              </Menu.Item>
            )}

            {onDelete && (
              <Menu.Item
                onClick={onDelete}
                leftSection={<IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
              >
                {t('delete', 'Delete')}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
      {children}
    </Paper>
  );
};
