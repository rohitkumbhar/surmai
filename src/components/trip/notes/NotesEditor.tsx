import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { getTaskListExtension, Link, RichTextEditor } from '@mantine/tiptap';
import TipTapTaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Button, Group, Stack } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const NotesEditor = ({ notes, onSave }: { notes: string; onSave: (content: string) => void }) => {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      getTaskListExtension(TipTapTaskList),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'test-item',
        },
      }),
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      Color,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Add your trip notes here...' }),
    ],
    content: notes || '',
  });

  return (
    <Stack>
      <RichTextEditor editor={editor} variant={'subtle'}>
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
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>
      <Group justify={'flex-end'}>
        <Button
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
