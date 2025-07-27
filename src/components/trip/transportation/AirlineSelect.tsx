import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { CloseButton, Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { searchAirlines } from '../../../lib/api';
import { UseFormReturnType } from '@mantine/form';
import { Airline } from '../../../types/trips';
import { useTranslation } from 'react-i18next';
import { IconPlane } from '@tabler/icons-react';

export const AirlineSelect = ({
                                propName,
                                form,
                                label,
                                description,
                                required,
                                withAsterisk,
                                currentValue,
                              }: {
  propName: string;
  form: UseFormReturnType<unknown>;
  label: string;
  description: string;
  required: boolean;
  withAsterisk: boolean;
  currentValue?: Airline;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string | Airline | undefined>(currentValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const combobox = useCombobox();

  useEffect(() => {
    if (search?.length > 1) {
      setLoading(true);
      searchAirlines(search).then((results) => {
        setSearchResults(results.items as unknown as Airline[]);
        setLoading(false);
        combobox.openDropdown();
      });
    }
  }, [search]);

  const options = searchResults
    .filter((item) => item.code && item.code !== '')
    .map((item) => (
      <Combobox.Option value={item.id} key={item.id}>
        <Group gap={'xs'}>
          <Text size={'md'} fw={400}>
            {item.name}
          </Text>
        </Group>
      </Combobox.Option>
    ));

  const handleValueSelect = (val: string) => {
    if (val === 'create_new') {
      setValue(search);
      form.setFieldValue(propName, search);
    } else {
      const selection = searchResults.find((item) => item.id === val);
      if (selection) {
        setValue(selection.name);
        form.setFieldValue(propName, {
          code: selection.code,
          name: selection.name,
          id: selection.id,
          logo: selection.logo,
        });
      }
    }
    combobox.closeDropdown();
  };

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
      <Combobox.Target>
        <InputBase
          ref={inputRef as MutableRefObject<HTMLInputElement>}
          label={label}
          description={description}
          required={required}
          withAsterisk={withAsterisk}
          rightSection={
            value ? (
              <CloseButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue(undefined);
                  setSearchResults([]);
                  setSearch('');
                  if (inputRef?.current) {
                    inputRef.current.value = '';
                  }
                }}
                aria-label="Clear value"
              />
            ) : (
              <IconPlane size={15} />
            )
          }
          // @ts-expect-error shh
          value={currentValue ? currentValue.name : (value?.name ? value.name : value)}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
          }}
          placeholder={t('transportation_airline_name', 'Airline Name')}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {loading && <Combobox.Empty>Loading....</Combobox.Empty>}
          {!loading && options.length > 0 && options}
          {!loading && options.length === 0 && search != '' && (
            <Combobox.Option value={'create_new'} key={'create_new'}>
              <Group gap={'xs'}>
                <Text size={'md'} fw={400}>
                  {search}
                </Text>
                <Text size={'xs'} c={'dimmed'}>{`Create New Entry`}</Text>
              </Group>
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
