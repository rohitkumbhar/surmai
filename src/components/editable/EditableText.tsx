import {ActionIcon, Container, CSSProperties, Overlay, Text, Textarea, TextInput} from "@mantine/core";
import {useClickOutside, useHover, useId} from "@mantine/hooks";
import {IconCheck, IconEdit} from "@tabler/icons-react";
import {useState} from "react";
import {useForm} from "@mantine/form";


const EditOverlay = ({onClick}: { onClick: () => void }) => {
  return (<Overlay fixed={false}
                   color="var(--mantine-primary-color-0)"
                   onClick={onClick}
                   bd={"dashed blue 1px"}
                   backgroundOpacity={0.1}>
              <span style={{float: "right", position: 'absolute', bottom: '1px', right: '1px'}}>
                  <IconEdit/>
              </span>
  </Overlay>)
}

export const EditableText = ({text, label, onChange, validate, styleProps, multiline, children}: {
  text?: string,
  label: string,
  onChange?: (val: string) => void,
  validate: (value: string) => string | null
  styleProps?: CSSProperties,
  multiline?: boolean,
  children?: React.ReactNode
}) => {

  const {hovered, ref} = useHover();
  const [editMode, setEditMode] = useState<boolean>(false);
  const inputRef = useClickOutside(() => setEditMode(false));
  const elementId = useId(label);
  const initialValues: { [key: string]: string | undefined } = {}
  initialValues[elementId] = text

  const validationHandler = {}
  // @ts-expect-error todo
  validationHandler[elementId] = validate

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: initialValues,
    validate: validationHandler,
  });

  const onSubmitForm = (values) => {
    console.log("values,", values)
    setEditMode(false);
    onChange && onChange(values[elementId])
  }

  return (
    <div ref={ref} style={{...styleProps, position: "relative"}}>
      {!editMode && children && (<span>{children}
        {hovered && <EditOverlay onClick={() => {
          setEditMode(true)
        }}/>}
      </span>)}

      {editMode && <div ref={inputRef}>
          <form onSubmit={form.onSubmit(onSubmitForm)}>

            {!multiline && <TextInput mt={"md"}
                                      {...form.getInputProps(elementId)}
                                      rightSection={
                                        <ActionIcon type={"submit"} variant="filled" aria-label="Settings">
                                          <IconCheck style={{width: '70%', height: '70%'}} stroke={1.5}/>
                                        </ActionIcon>
                                      }
            />}
            {multiline && <Textarea mt={"md"}
                                    {...form.getInputProps(elementId)}
                                    rightSection={
                                      <ActionIcon type={"submit"} variant="filled" aria-label="Settings">
                                        <IconCheck style={{width: '70%', height: '70%'}} stroke={1.5}/>
                                      </ActionIcon>
                                    }
            />}

          </form>
      </div>}
    </div>
  )
}