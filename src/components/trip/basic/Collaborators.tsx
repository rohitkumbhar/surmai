import { ContextModalProps, openConfirmModal } from '@mantine/modals';
import { Trip } from '../../../types/trips.ts';
import { forwardRef, useEffect, useState } from 'react';
import { ActionIcon, Avatar, Button, ComboboxItem, Container, Group, MultiSelect, Paper, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { addCollaborators, currentUser as getCurrentUser, deleteCollaborator, listAllUsers } from '../../../lib/api';
import { User } from '../../../types/auth.ts';
import { IconTrash, IconUser } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const UserSearch = ({ trip, setNewCollaborators }: { trip: Trip; setNewCollaborators: (val: string[]) => void }) => {
  const [curUser, setCurrentUser] = useState<User | undefined>();
  const { data } = useQuery<User[]>({
    queryKey: ['listAllUsers'],
    queryFn: () => listAllUsers(),
  });

  const userIndex: Map<string, User> = (data || []).reduce((accumulator, obj) => {
    return accumulator.set(obj.id, obj);
  }, new Map<string, User>());

  const renderOption = ({ option }: { option: ComboboxItem }) => {
    const user = userIndex.get(option.value);
    return (
      <Group gap="sm">
        <IconUser stroke={1} />
        <div>
          <Text size="sm">{option?.label}</Text>
          <Text size="xs" opacity={0.5}>
            {user?.email || 'No email'}
          </Text>
        </div>
      </Group>
    );
  };

  const onChange = async (value: string[]) => {
    // await addCollaborator(trip.id, value)
    // onSave()
    setNewCollaborators(value);
  };

  useEffect(() => {
    const fetchMe = async () => {
      const me = await getCurrentUser();
      setCurrentUser(me);
    };
    fetchMe();
  }, []);

  const [options, setOptions] = useState<ComboboxItem[]>([]);
  useEffect(() => {
    const opts =
      data?.map((user) => {
        const isOwner = user.id === trip.ownerId;
        const isExistingCollaborator = trip.collaborators?.find((ec) => ec.id === user.id);
        const isMe = curUser?.id === user.id;
        const label = `${user.name} ${isOwner ? '(Owner)' : ''}`;
        return {
          value: user.id,
          label,
          disabled: (isExistingCollaborator || isMe || isOwner) as boolean,
        };
      }) || [];
    setOptions(opts);
  }, [data, trip, curUser]);

  return (
    <MultiSelect
      w={'400px'}
      label="Select Collaborator"
      renderOption={renderOption}
      placeholder="Pick a user"
      data={options}
      onChange={onChange}
    />
  );
};

const CollaboratorButton = forwardRef<HTMLDivElement, { trip: Trip; user: User; onSave: () => void }>((props, ref) => {
  const { t } = useTranslation();
  const { trip, user, onSave } = props;
  const { name, email } = user;
  return (
    <div ref={ref}>
      <Paper shadow={'sm'} p={'xs'} bd={'1px solid var(--mantine-primary-color-2)'}>
        <Group>
          <Avatar key={name} name={name} color="initials" />
          <div>
            <Text fz="md" fw={500}>
              {name}
            </Text>
            <Text fz="xs" c="dimmed">
              {email || 'No e-mail'}
            </Text>
          </div>
          <ActionIcon
            variant="subtle"
            aria-label="Delete Collaborator"
            style={{ height: '100%' }}
            c={'red'}
            onClick={() => {
              openConfirmModal({
                title: t('delete_collaborator', 'Delete Collaborator'),
                confirmProps: { color: 'red' },
                children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
                labels: {
                  confirm: t('delete', 'Delete'),
                  cancel: t('cancel', 'Cancel'),
                },
                onCancel: () => {},
                onConfirm: () => {
                  deleteCollaborator(trip.id, user.id).then(() => {
                    onSave();
                  });
                },
              });
            }}
          >
            <IconTrash stroke={1.5} />
          </ActionIcon>
        </Group>
      </Paper>
    </div>
  );
});

export const Collaborators = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  trip: Trip;
  onSave: () => void;
}>) => {
  const { trip, onSave } = innerProps;
  const [newCollaborators, setNewCollaborators] = useState<string[]>([]);
  const saveNewCollaborators = () => {
    addCollaborators(trip.id, newCollaborators).then(() => {
      context.closeModal(id);
      onSave();
    });
  };

  return (
    <Container>
      <Group>
        <UserSearch trip={trip} setNewCollaborators={setNewCollaborators} />
      </Group>
      <Group mt={'md'}>
        {(trip.collaborators || []).map((collaborator) => {
          return (
            <Group wrap={'nowrap'} key={collaborator.id}>
              <CollaboratorButton trip={trip} user={collaborator} onSave={onSave} />
            </Group>
          );
        })}
      </Group>
      <Group mt={'300px'}>
        <Button
          type={'button'}
          variant={'default'}
          onClick={() => {
            context.closeModal(id);
          }}
        >
          Cancel
        </Button>
        <Button onClick={saveNewCollaborators}>Save</Button>
      </Group>
    </Container>
  );
};
