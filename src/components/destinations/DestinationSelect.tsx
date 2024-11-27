import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Combobox, Group, Pill, PillsInput, Text, useCombobox } from '@mantine/core';
import { useClickOutside, useDebouncedState } from '@mantine/hooks';
import { searchPlaces } from '../../lib';
import { nanoid } from 'nanoid';
import { UseFormReturnType } from '@mantine/form';
import { Destination } from '../../types/trips.ts';
import { useTranslation } from 'react-i18next';

export function DestinationSelect({ propName, form }: { propName: string; form: UseFormReturnType<unknown> }) {
  const { t } = useTranslation();
  const currentValues = form.getValues();
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Destination[]>(
    // @ts-expect-error Existing values match type
    currentValues ? (currentValues[propName] as Destination[]) || [] : [],
  );

  const combobox = useCombobox();
  const inputRef = useRef<HTMLInputElement>();
  const dropdownRef = useClickOutside(() => combobox.closeDropdown());

  useEffect(() => {
    if (search?.length > 1) {
      setLoading(true);
      searchPlaces(search).then((results) => {
        setSearchResults(results.items as unknown as Destination[]);
        setLoading(false);
        combobox.openDropdown();
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

    combobox.closeDropdown();
  };

  return (
    <>
      <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
        <Combobox.Target>
          <PillsInput
            label={t('basic.trip_destinations', 'Destinations')}
            description={t(
              'basic.trip_destinations_description',
              'Enter the destinations in this trip e.g. San Jose, Guanacaste'
            )}
            withAsterisk
            required
            key={form.key(propName)}
            {...form.getInputProps(propName)}
          >
            <Pill.Group>
              {values.map((v) => {
                return (
                  <Pill
                    radius={'xs'}
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
          <Combobox.Options mah={300} style={{ overflowY: 'auto' }}>
            {loading && <Combobox.Empty>Loading....</Combobox.Empty>}
            {!loading && (
              <Combobox.Option value={'create_new'} key={'create_new'}>
                <Group gap={'xs'}>
                  <Text size={'md'} fw={400}>
                    {search}
                  </Text>
                  <Text size={'xs'} c={'dimmed'}>
                    {t('basic.create_new_entry', 'Create New Entry')}
                  </Text>
                </Group>
              </Combobox.Option>
            )}
            {!loading && options.length > 0 && options}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </>
  );
}
