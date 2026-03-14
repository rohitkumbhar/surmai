import { ActionIcon, Anchor, Badge, Card, Flex, Group, Stack, Text } from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import { IconEdit } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { getAttachmentUrl } from '../../../lib/api';

import type { Attachment, ConvertedExpense } from '../../../types/trips.ts';

export const ExpenseCard = ({
  expense,
  attachments,
  categoryData,
  onEdit,
}: {
  expense: ConvertedExpense;
  attachments: Attachment[];
  categoryData: Record<string, { label: string; color: string }>;
  onEdit: () => void;
}) => {
  const { t } = useTranslation();
  const { isMobile } = useSurmaiContext();

  const openAttachmentViewer = (attachment: Attachment) => {
    const url = getAttachmentUrl(attachment, attachment.file);
    openContextModal({
      modal: 'attachmentViewer',
      title: attachment.name,
      radius: 'md',
      withCloseButton: true,
      fullScreen: isMobile,
      size: 'auto',
      innerProps: {
        fileName: attachment.name,
        attachmentUrl: url,
      },
    });
  };

  return (
    <Card withBorder padding="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={500} size="lg" lineClamp={1}>
              {expense.name}
            </Text>
          </Stack>
          <ActionIcon
            variant="default"
            aria-label={t('edit_expense', 'Edit Expense')}
            onClick={onEdit}
            title={t('edit_expense', 'Edit Expense')}
          >
            <IconEdit size={18} />
          </ActionIcon>
        </Group>

        <Flex direction="column" gap="xs" mt="xs">
          {expense.occurredOn && (
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {t('date', 'Date')}:
              </Text>
              <Text size="sm" c="dimmed">
                {dayjs(expense.occurredOn).format('ll')}
              </Text>
            </Group>
          )}

          <Group gap="xs">
            <Text size="sm" fw={500}>
              {t('category', 'Category')}:
            </Text>
            <Badge variant="light" size="sm">
              {categoryData[expense.category || 'other']?.label}
            </Badge>
          </Group>

          {expense.convertedCost && (
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {t('amount', 'Amount')}:
              </Text>
              <Text size="sm" fw={600} c="blue">
                {expense.convertedCost.value} {expense.convertedCost.currency}
              </Text>
            </Group>
          )}
          {attachments.length > 0 && (
            <Group>
              {attachments.map((attachment) => (
                <Anchor key={attachment.id} size="sm" onClick={() => openAttachmentViewer(attachment)}>
                  {attachment.name}
                </Anchor>
              ))}
            </Group>
          )}
        </Flex>
      </Stack>
    </Card>
  );
};
