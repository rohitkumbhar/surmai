import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { CloseButton, Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useClickOutside, useDebouncedState } from '@mantine/hooks';
import { searchAirports } from '../../lib';
import { nanoid } from 'nanoid';
import { UseFormReturnType } from '@mantine/form';
import { Airport } from '../../types/trips.ts';

export function AutocompleteLoading({ propName, form }: { propName: string; form: UseFormReturnType<unknown> }) {
  const currentValues = form.getValues();
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  // @ts-expect-error its ok
  const [value, setValue] = useState<Airport | undefined>(currentValues ? currentValues[propName] : undefined);
  const inputRef = useRef<HTMLInputElement>();


  // const inputRef = useRef<HTMLInputElement>();
  const dropdownRef = useClickOutside(() => setOpened(false));
  const combobox = useCombobox({ opened });

  useEffect(() => {
    if (search?.length > 1) {
      setLoading(true);
      searchAirports(search).then((results) => {
        setSearchResults(results.items as unknown as Airport[]);
        setLoading(false);
        setOpened(true);
      });
    }
  }, [search]);

  const options = searchResults
    .filter(item => item.iata_code && item.iata_code !== '')
    .map((item) => (
      <Combobox.Option value={item.id} key={item.id}>
        <Group gap={'xs'}>
          <Text size={'md'} fw={400}>
            {item.name}
          </Text>
          <Text size={'xs'} c={'dimmed'}>{`${item.iata_code}`}</Text>
        </Group>
      </Combobox.Option>
    ));

  const handleValueSelect = (val: string) => {

    if (val === 'create_new') {
      const updatedValue = { iata_code: `create_new_${nanoid()}`, name: search };
      // @ts-expect-error its ok
      setValue(updatedValue);
      form.setFieldValue(propName, updatedValue);
    } else {
      const selection = searchResults.find((item) => item.id === val);
      setValue(selection);
      form.setFieldValue(propName, selection);

    }
    setOpened(false);
  };

  return (
    <>
      <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
        <Combobox.Target>
          <InputBase
            ref={inputRef as MutableRefObject<HTMLInputElement>}

            rightSection={<CloseButton
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
            />}
            value={value?.iata_code}
            onChange={(event) => {
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
              setSearch(event.currentTarget.value);
            }}

            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => {
              combobox.closeDropdown();
              // setSearch(value || '');
            }}
            placeholder="Search value"
          />

        </Combobox.Target>
        <Combobox.Dropdown ref={dropdownRef}>
          <Combobox.Options>
            {loading && <Combobox.Empty>Loading....</Combobox.Empty>}
            {!loading && options.length > 0 && options}
            {!loading && options.length === 0 && (
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
    </>
  );
}
