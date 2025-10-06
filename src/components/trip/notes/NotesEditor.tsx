import { Button, Group, Stack } from '@mantine/core';
import { getTaskListExtension, Link, RichTextEditor } from '@mantine/tiptap';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TipTapTaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslation } from 'react-i18next';

import { InsertTableControl } from './InsertTableControl.tsx';
import styles from './TripNotes.module.css';

const NotesEditor = ({ notes, onSave }: { notes: string; onSave: (content: string) => void }) => {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      getTaskListExtension(TipTapTaskList),
      TaskItem.configure({
        nested: false,
      }),
      //      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      Color,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: t(
          'notes_placeholder',
          'You can use notes to jot down anything that is not covered under Organization or just for brainstorming with collaborators. For example, a task list or links to local attractions.'
        ),
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        lastColumnResizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: notes || '',
  });

  return (
    <Stack>
      <RichTextEditor editor={editor} mih={200}>
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ColorPicker
            colors={[
              '#25262b',
              '#868e96',
              '#fa5252',
              '#e64980',
              '#be4bdb',
              '#7950f2',
              '#4c6ef5',
              '#228be6',
              '#15aabf',
              '#12b886',
              '#40c057',
              '#82c91e',
              '#fab005',
              '#fd7e14',
            ]}
          />
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.TaskList />
            <RichTextEditor.TaskListLift />
            <RichTextEditor.TaskListSink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <InsertTableControl />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content className={styles.tiptap} aria-label="Notes" />
      </RichTextEditor>
      <Group justify={'flex-end'}>
        <Button
          data-testid="save-notes-btn"
          leftSection={<IconDeviceFloppy />}
          onClick={() => {
            onSave(editor?.getHTML() || '');
          }}
        >
          {t('save', 'Save')}
        </Button>
      </Group>
    </Stack>
  );
};

export default NotesEditor;
