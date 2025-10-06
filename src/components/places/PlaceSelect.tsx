import { Anchor, Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { searchPlaces } from '../../lib/api';

import type { Place } from '../../types/trips';
import type { UseFormReturnType } from '@mantine/form';

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
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [fieldValue, setFieldValue] = useState<string | undefined>(selectedPlaceName);
  const combobox = useCombobox({ defaultOpened: false });
  const dropdownRef = useClickOutside(() => combobox.closeDropdown());

  useEffect(() => {
    // handleSearch(search, page);
    setLoading(true);
    if (search.trim() !== '') {
      searchPlaces(search, page, 20).then((results) => {
        setSearchResults(results.items as unknown as Place[]);
        setHasNextPage(page < (results.totalPages || 0));
      });
    } else {
      setSearchResults([]);
    }
    setLoading(false);
  }, [search, page]);

  const options = searchResults.map((item) => (
    <Combobox.Option value={item.id} key={item.id}>
      <Group gap={'xs'}>
        <Text size={'sm'}>{item.name}</Text>
        <Text size={'xs'} c={'dimmed'}>{`${item.stateName}, ${item.countryName}`}</Text>
      </Group>
    </Combobox.Option>
  ));

  const destinationOptions = presetDestinations.map((item) => (
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
      const selection = [...searchResults, ...presetDestinations].find((item) => item.id === val);
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
          defaultValue={fieldValue}
          label={label}
          description={description}
          withAsterisk
          required
          onClick={() => combobox.toggleDropdown()}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown ref={dropdownRef}>
        <Combobox.Options mah={300} style={{ overflowY: 'auto' }}>
          <Combobox.Group label={t('destinations', 'Destinations')}>{destinationOptions}</Combobox.Group>
          {!loading && search.length > 0 && searchResults.length === 0 && (
            <Combobox.Group label={t('create_new_entry', 'Create New Entry')}>
              <Combobox.Option value={'create_new'} key={'create_new'}>
                <Group gap={'xs'}>
                  <Text size={'sm'} fw={500}>
                    {search}
                  </Text>
                </Group>
              </Combobox.Option>
            </Combobox.Group>
          )}
          {!loading && options.length > 0 && (
            <Combobox.Group label={t('search_results', 'Search Results')}>
              {options}
              {hasNextPage && (
                <Anchor p={'sm'} size={'md'} onClick={() => setPage(page + 1)}>
                  {t('load_more_results', 'Load more results')}
                </Anchor>
              )}
            </Combobox.Group>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
