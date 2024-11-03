import { PasswordInput, Popover, Progress } from '@mantine/core';
import { PasswordRequirement } from './PasswordRequirement.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStrength, passwordRequirements } from './util.ts';
import { UseFormReturnType } from '@mantine/form';
import { SignUpForm } from '../../types/auth.ts';

export const FancyPasswordInput = ({
  fieldName,
  form,
}: {
  fieldName: string;
  form: UseFormReturnType<SignUpForm>;
}) => {
  const { t } = useTranslation();
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [currentPasswordValue, setCurrentPasswordValue] = useState('');

  const strength = getStrength(currentPasswordValue);
  const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

  const checks = passwordRequirements.map((requirement, index) => (
    <PasswordRequirement
      key={index}
      label={requirement.label}
      meets={requirement.re.test(currentPasswordValue)}
    />
  ));

  // @ts-expect-error It works really
  form.watch(fieldName, ({ value }: { value: string }) => {
    setCurrentPasswordValue(value);
  });

  return (
    <Popover
      opened={popoverOpened}
      position="bottom"
      width="target"
      transitionProps={{ transition: 'pop' }}
    >
      <Popover.Target>
        <div
          onFocusCapture={() => setPopoverOpened(true)}
          onBlurCapture={() => setPopoverOpened(false)}
        >
          <PasswordInput
            mt="md"
            label={t('password', 'Password')}
            withAsterisk
            key={form.key(fieldName)}
            {...form.getInputProps(fieldName)}
          />
        </div>
      </Popover.Target>
      <Popover.Dropdown>
        <Progress color={color} value={strength} size={5} mb="xs" />
        <PasswordRequirement
          label={t(
            'password_includes_8_chars',
            'Includes at least 8 characters'
          )}
          meets={currentPasswordValue.length > 7}
        />
        {checks}
      </Popover.Dropdown>
    </Popover>
  );
};
