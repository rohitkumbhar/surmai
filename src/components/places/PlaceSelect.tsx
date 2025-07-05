import { useState } from 'react';
import { Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core';
import { useClickOutside, useDebouncedCallback } from '@mantine/hooks';
import { searchPlaces } from '../../lib/api';
import { nanoid } from 'nanoid';
import { UseFormReturnType } from '@mantine/form';
import { Place } from '../../types/trips';
import { useTranslation } from 'react-i18next';

export function PlaceSelect({
  propName,
  form,
  presetDestinations,
  label,
  description,
}: {
  propName: string;
  form: UseFormReturnType<unknown>;
  presetDestinations: Place[];
  label: string;
  description: string;
}) {
  const { t } = useTranslation();
  const formValues = form.getValues();

  // @ts-expect-error its ok
  const selectedPlace = formValues[propName];
  let selectedPlaceName = undefined;
  if (selectedPlace && typeof selectedPlace === 'object') {
    selectedPlaceName = selectedPlace.name;
  } else {
    selectedPlaceName = selectedPlace;
  }

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [searchResults, setSearchResults] = useState<Place[]>(presetDestinations);
  const [fieldValue, setFieldValue] = useState<string | undefined>(selectedPlaceName);

  const combobox = useCombobox();
  const dropdownRef = useClickOutside(() => combobox.closeDropdown());

  const handleSearch = useDebouncedCallback(async (query: string) => {
    setLoading(true);
    const results = await searchPlaces(query);
    setSearchResults(results.items as unknown as Place[]);
    setLoading(false);
    combobox.openDropdown();
  }, 500);

  const options = searchResults.map((item) => (
    <Combobox.Option value={item.id} key={item.id}>
      <Group gap={'xs'}>
        <Text size={'sm'}>{item.name}</Text>
        <Text size={'xs'} c={'dimmed'}>{`${item.stateName}, ${item.countryName}`}</Text>
      </Group>
    </Combobox.Option>
  ));

  const handleValueSelect = (val: string) => {
    if (val === 'create_new') {
      const updatedValues = { id: `create_new_${nanoid()}`, name: search };
      setFieldValue(updatedValues.name);
      form.setFieldValue(propName, updatedValues);
    } else {
      const selection = searchResults.find((item) => item.id === val);
      if (selection) {
        setFieldValue(selection.name);
        form.setFieldValue(propName, selection);
      }
    }
    combobox.closeDropdown();
  };

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect} size={'md'}>
      <Combobox.Target>
        <TextInput
          value={fieldValue}
          placeholder={t('select_place', 'Select')}
          pointer
          rightSection={<Combobox.Chevron />}
          label={label}
          description={description}
          withAsterisk
          required
          onClick={() => combobox.toggleDropdown()}
          key={form.key(propName)}
          {...form.getInputProps(propName)}
        />
      </Combobox.Target>
      <Combobox.Dropdown ref={dropdownRef}>
        <Combobox.Search
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            handleSearch(event.currentTarget.value);
          }}
          placeholder="Search"
        />
        <Combobox.Options mah={300} style={{ overflowY: 'auto' }}>
          {loading && <Combobox.Empty>Loading....</Combobox.Empty>}
          {!loading && search.length > 0 && (
            <Combobox.Option value={'create_new'} key={'create_new'}>
              <Group gap={'xs'}>
                <Text size={'md'} fw={400}>
                  {search}
                </Text>
                <Text size={'xs'} c={'dimmed'}>
                  {t('create_new_entry', 'Create New Entry')}
                </Text>
              </Group>
            </Combobox.Option>
          )}
          {!loading && options.length > 0 && options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
