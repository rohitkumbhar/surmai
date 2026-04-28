import {
  Button,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { createAnnouncement, listAnnouncements } from '../../lib/api';
import type { Announcement } from '../../types/notifications';
import { useCurrentUser } from '../../auth/useCurrentUser';

export const Announcements = () => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const { isPending: fetchAnnouncementsPending, data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: listAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const form = useForm({
    initialValues: {
      subject: '',
      text: '',
      message: '',
      expiry: null as string | null,
      sender: user?.name || 'Administrator',
    },
    validate: {
      subject: (value) => (value.length < 1 ? t('subject_required', 'Subject is required') : null),
    },
  });

  const handleCreate = async (values: typeof form.values) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        expiry: values.expiry ? values.expiry : dayjs().add(7, 'day').toDate().toISOString(),
      });
      notifications.show({
        title: t('success', 'Success'),
        message: t('announcement_created', 'Announcement created successfully'),
        color: 'green',
      });
      close();
      form.reset();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: t('error', 'Error'),
        message: t('announcement_create_failed', 'Failed to create announcement'),
        color: 'red',
      });
    }
  };

  const rows = announcements.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>{item.subject}</Table.Td>
      <Table.Td>{item.sender}</Table.Td>
      <Table.Td>{dayjs(item.created).format('L')}</Table.Td>
      <Table.Td>{item.expiry ? dayjs(item.expiry).format('L') : '-'}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Stack mt="md">
        <Group justify="space-between">
          <Title order={4}>{t('announcements', 'Announcements')}</Title>
          <Button onClick={open}>{t('create_announcement', 'Create Announcement')}</Button>
        </Group>

        <LoadingOverlay
          visible={fetchAnnouncementsPending}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ type: 'bars' }}
        />

        <ScrollArea mt={'md'}>
          <Table miw={800} verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('subject', 'Subject')}</Table.Th>
                <Table.Th>{t('sender', 'Sender')}</Table.Th>
                <Table.Th>{t('created', 'Created')}</Table.Th>
                <Table.Th>{t('expiry', 'Expiry')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows}
              {announcements.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center">
                      {t('no_announcements', 'No announcements')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Modal opened={opened} onClose={close} title={t('create_announcement', 'Create Announcement')} size={'xl'}>
          <form onSubmit={form.onSubmit(handleCreate)}>
            <Stack>
              <TextInput label={t('subject', 'Subject')} required {...form.getInputProps('subject')} />
              <TextInput label={t('summary', 'Summary (Short Text)')} {...form.getInputProps('text')} />
              <Textarea
                label={t('message', 'Full Message')}
                resize="vertical"
                minRows={5}
                {...form.getInputProps('message')}
              />
              <DateInput
                label={t('expiry_date', 'Expiry Date')}
                {...form.getInputProps('expiry')}
                clearable
                minDate={dayjs().format('YYYY-MM-DD')}
              />
              <Group justify="flex-end">
                <Button type="submit" loading={createMutation.isPending}>
                  {t('create', 'Create')}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Card>
  );
};
