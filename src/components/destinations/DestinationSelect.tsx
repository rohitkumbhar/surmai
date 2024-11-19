import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Combobox, Group, Pill, PillsInput, Text, useCombobox } from '@mantine/core';
import { useClickOutside, useDebouncedState } from '@mantine/hooks';
import { searchCities } from '../../lib';
import { nanoid } from 'nanoid';
import { UseFormReturnType } from '@mantine/form';
import { Destination } from '../../types/trips.ts';

export function DestinationSelect({ propName, form }: { propName: string; form: UseFormReturnType<unknown> }) {
  const currentValues = form.getValues();
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Destination[]>(
    // @ts-expect-error Existing values match type
    currentValues ? (currentValues[propName] as Destination[]) || [] : []
  );

  const inputRef = useRef<HTMLInputElement>();
  const dropdownRef = useClickOutside(() => setOpened(false));
  const combobox = useCombobox({ opened });

  useEffect(() => {
    if (search?.length > 3) {
      setLoading(true);
      searchCities(search).then((results) => {
        setSearchResults(results.items as unknown as Destination[]);
        setLoading(false);
        setOpened(true);
      });
    }
  }, [search]);

  const options = searchResults.map((item) => (
    <Combobox.Option value={item.id} key={item.id}>
      <Group gap={'xs'}>
        <Text size={'md'} fw={400}>
          {item.name}
        </Text>
        <Text size={'xs'} c={'dimmed'}>{`${item.stateName}, ${item.countryName}`}</Text>
      </Group>
    </Combobox.Option>
  ));

  const handleValueSelect = (val: string) => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    if (val === 'create_new') {
      const updatedValues = [...values, { id: `create_new_${nanoid()}`, name: search }];
      setValues(updatedValues);
      form.setFieldValue(propName, updatedValues);
    } else {
      const selection = searchResults.find((item) => item.id === val);
      const existing = values.find((v) => v.id === val);
      if (!existing && selection) {
        const updatedValues = [...values, selection];
        setValues(updatedValues);
        form.setFieldValue(propName, updatedValues);
      }
    }

    setOpened(false);
  };

  return (
    <>
      <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
        <Combobox.Target>
          <PillsInput
            label="Destinations"
            description="Enter the destinations in this trip e.g. San Jose, Guanacaste"
            withAsterisk
            required
            key={form.key(propName)}
            {...form.getInputProps(propName)}
          >
            <Pill.Group>
              {values.map((v) => {
                return (
                  <Pill
                    key={v.id}
                    withRemoveButton
                    onRemove={() => {
                      const updatedValues = values.filter((e) => e.id !== v.id);
                      setValues(updatedValues);
                      form.setFieldValue(propName, updatedValues);
                    }}
                  >
                    {v.name}
                  </Pill>
                );
              })}

              <Combobox.EventsTarget>
                <PillsInput.Field
                  ref={inputRef as MutableRefObject<HTMLInputElement>}
                  onChange={(ev) => {
                    setSearch(ev.target.value);
                  }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
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
