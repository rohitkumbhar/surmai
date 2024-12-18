import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { CloseButton, Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { searchAirports } from '../../../lib';
import { UseFormReturnType } from '@mantine/form';
import { Airport } from '../../../types/trips.ts';

export const AirportSelect = ({
  propName,
  form,
  label,
  required,
  withAsterisk,
}: {
  propName: string;
  form: UseFormReturnType<unknown>;
  label: string;
  required: boolean;
  withAsterisk: boolean;
}) => {
  const currentValues = form.getValues();
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  // @ts-expect-error its ok
  const [value, setValue] = useState<string | undefined>(currentValues ? currentValues[propName] : undefined);
  const inputRef = useRef<HTMLInputElement>();
  const combobox = useCombobox();

  useEffect(() => {
    if (search?.length > 1) {
      setLoading(true);
      searchAirports(search).then((results) => {
        setSearchResults(results.items as unknown as Airport[]);
        setLoading(false);
        combobox.openDropdown();
      });
    }
  }, [search]);

  const options = searchResults
    .filter((item) => item.iataCode && item.iataCode !== '')
    .map((item) => (
      <Combobox.Option value={item.id} key={item.id}>
        <Group gap={'xs'}>
          <Text size={'md'} fw={400}>
            {item.name}
          </Text>
          <Text size={'xs'} c={'dimmed'}>{`${item.iataCode}`}</Text>
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
        setValue(selection.iataCode);
        form.setFieldValue(propName, selection.iataCode);
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
                  // @ts-expect-error its ok
                  inputRef.current.value = '';
                }}
                aria-label="Clear value"
              />
            ) : null
          }
          value={value}
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
          placeholder="Search value"
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
