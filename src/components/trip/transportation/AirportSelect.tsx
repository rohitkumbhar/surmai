import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { CloseButton, Combobox, Group, InputBase, ScrollArea, Text, useCombobox } from '@mantine/core';
import { searchAirports } from '../../../lib/api';
import { UseFormReturnType } from '@mantine/form';
import { Airport } from '../../../types/trips';
import { useTranslation } from 'react-i18next';
import { IconPlaneArrival, IconPlaneDeparture } from '@tabler/icons-react';

export const AirportSelect = ({
  propName,
  form,
  label,
  required = true,
  description,
  withAsterisk = true,
  currentValue,
}: {
  propName: string;
  form: UseFormReturnType<unknown>;
  label: string;
  description: string;
  required?: boolean;
  withAsterisk?: boolean;
  currentValue?: Airport;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<string | Airport | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
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
        if (inputRef.current) {
          inputRef.current.value = selection.iataCode as string;
        }
        form.setFieldValue(propName, {
          iataCode: selection.iataCode,
          name: selection.name,
          id: selection.id,
          countryCode: selection.isoCountry,
          latitude: selection.latitude,
          longitude: selection.longitude,
          timezone: selection.timezone,
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
            currentValue || value ? (
              <CloseButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue(undefined);
                  form.setFieldValue(propName, undefined);
                  setSearchResults([]);
                  setSearch('');
                  if (inputRef?.current) {
                    inputRef.current.value = '';
                  }
                }}
                aria-label="Clear value"
              />
            ) : propName === 'destination' ? (
              <IconPlaneArrival size={15} />
            ) : (
              <IconPlaneDeparture size={15} />
            )
          }
          // @ts-expect-error its ok
          defaultValue={currentValue ? currentValue.iataCode : value?.iataCode || value}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setValue(event.currentTarget.value);
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
          }}
          placeholder={t('transportation_airport_code', 'Airport Code')}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize type="scroll">
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
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
