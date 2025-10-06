import { Anchor, Combobox, Group, Pill, PillsInput, Text, useCombobox } from '@mantine/core';
import { useClickOutside, useDebouncedState } from '@mantine/hooks';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { searchPlaces } from '../../lib/api';


import type { Place } from '../../types/trips';
import type { UseFormReturnType } from '@mantine/form';
import type { MutableRefObject} from 'react';

export function PlaceMultiSelect({ propName, form }: { propName: string; form: UseFormReturnType<unknown> }) {
  const { t } = useTranslation();
  const currentValues = form.getValues();
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [values, setValues] = useState<Place[]>(
    // @ts-expect-error Existing values match type
    currentValues ? (currentValues[propName] as Place[]) || [] : []
  );

  const combobox = useCombobox();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useClickOutside(() => combobox.closeDropdown());

  useEffect(() => {
    if (search?.length > 1) {
      setLoading(true);
      searchPlaces(search, page, 20).then((results) => {
        setSearchResults(results.items as unknown as Place[]);
        setHasNextPage(page < (results.totalPages || 0));
        setLoading(false);
        combobox.openDropdown();
      });
    }
  }, [search, page]);

  const options = searchResults.map((item) => (
    <Combobox.Option value={item.id} key={item.id}>
      <Group gap={'xs'}>
        <Text size={'sm'}>{item.name}</Text>
        <Text size={'xs'} c={'dimmed'}>{`${item.stateName}, ${item.countryName}`}</Text>
      </Group>
    </Combobox.Option>
  ));

  const handleValueSelect = (val: string) => {
    if (inputRef?.current) {
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
        const updatedValues = [...values, { ...selection }];
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
            label={t('trip_destinations', 'Destinations')}
            description={t(
              'trip_destinations_description',
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
                    setPage(1);
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
                    {t('create_new_entry', 'Create New Entry')}
                  </Text>
                </Group>
              </Combobox.Option>
            )}
            {!loading && options.length > 0 && options}
            {hasNextPage && (
              <Anchor p={'sm'} size={'md'} onClick={() => setPage(page + 1)}>
                {t('load_more_results', 'Load more results')}
              </Anchor>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </>
  );
}
