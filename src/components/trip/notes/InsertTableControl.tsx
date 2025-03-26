import { RichTextEditor, useRichTextEditorContext } from '@mantine/tiptap';
import {
  IconColumnInsertRight,
  IconColumnRemove,
  IconRowInsertBottom,
  IconRowRemove,
  IconTable,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const InsertTableControl = () => {
  const { editor } = useRichTextEditorContext();
  const { t } = useTranslation();
  return (
    <>
      <RichTextEditor.Control
        onClick={() => editor?.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })}
        aria-label={t('insert_table', 'Insert Table')}
        title={t('insert_table', 'Insert Table')}
      >
        <IconTable stroke={1.5} size={16} />
      </RichTextEditor.Control>
      <RichTextEditor.Control
        onClick={() => editor?.commands.addRowAfter()}
        aria-label={t('add_row_below', 'Add Row Below')}
        title={t('add_row_below', 'Add Row Below')}
      >
        <IconRowInsertBottom stroke={1.5} size={16} />
      </RichTextEditor.Control>
      <RichTextEditor.Control
        onClick={() => editor?.commands.deleteRow()}
        aria-label={t('delete_row', 'Delete Row')}
        title={t('delete_row', 'Delete Row')}
      >
        <IconRowRemove stroke={1.5} size={16} />
      </RichTextEditor.Control>
      <RichTextEditor.Control
        onClick={() => editor?.commands.addColumnAfter()}
        aria-label={t('add_column_after', 'Add Column')}
        title={t('add_column_after', 'Add Column')}
      >
        <IconColumnInsertRight stroke={1.5} size={16} />
      </RichTextEditor.Control>
      <RichTextEditor.Control
        onClick={() => editor?.commands.deleteColumn()}
        aria-label={t('delete_column', 'Delete Column')}
        title={t('delete_column', 'Delete Column')}
      >
        <IconColumnRemove stroke={1.5} size={16} />
      </RichTextEditor.Control>
    </>
  );
};
