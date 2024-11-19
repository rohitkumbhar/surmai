import { useEffect, useState } from 'react';
import { Combobox, Group, Pill, PillsInput, Text, useCombobox } from '@mantine/core';
import { useClickOutside, useDebouncedState } from '@mantine/hooks';
import { searchCities } from '../../lib';
import { RecordModel } from 'pocketbase';

export function DestinationSelect() {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useDebouncedState('', 200);
  const [searchResults, setSearchResults] = useState<RecordModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<RecordModel[]>([]);


  const ref = useClickOutside(() => setOpened(false));
  const combobox = useCombobox({ opened });

  useEffect(() => {
    if (search?.length > 3) {
      setLoading(true);
      searchCities(search).then(results => {
        setSearchResults(results.items);
        setLoading(false);
        setOpened(true);
      });
    }
  }, [search]);

  const options = searchResults.map((item) => (
    <Combobox.Option value={item.id} key={item.id}>
      <Group gap={'xs'}>
        <Text size={'md'} fw={400}>{item.name}</Text>
        <Text size={'xs'} c={'dimmed'}>{`${item.state_name}, ${item.country_name}`}</Text>
      </Group>
    </Combobox.Option>
  ));

  const handleValueSelect = (val: string) => {
    const selection = searchResults.find(item => item.id === val);

    // handle create new

    const existing = values.find(v => v.id === val);
    if (!existing && selection) {
      const updatedValues = [...values, selection];
      setValues(updatedValues)
    }

    console.log('Selected values =>', selection);
    setOpened(false);
  };

  return (
    <>
      {/*<Button mb="md" onClick={() => setOpened((o) => !o)}>
        Toggle dropdown
      </Button>*/}

      <Combobox store={combobox}
                onOptionSubmit={handleValueSelect}
      >
        <Combobox.Target>
          {/*<TextInput
            label="Destinations"
            description="Dropdown is opened/closed when button is clicked"
            placeholder="Click button to toggle dropdown"
            onChange={(ev) => {
              setSearch(ev.target.value);
            }}
            onClick={(ev) => {
              if (ev.target?.value !== '') {
                setSearch(ev.target.value);
                setOpened(true);
              }
            }}
          />*/}
          <PillsInput
            label="Destinations"
            description="Dropdown is opened/closed when button is clicked"


          >
            <Pill.Group>
              {/*{values.length > 0 ? (
                values
              ) : (
                <Input.Placeholder>Pick one or more values</Input.Placeholder>
              )}*/}

              {values.map((v) => {

                return (
                  <Pill key={v.id} withRemoveButton onRemove={() => {
                    console.log("Remove ", v.id);
                  }}>
                    {v.name}
                  </Pill>
                )
              })}

              <Combobox.EventsTarget>
                <PillsInput.Field
                  onChange={(ev) => {
                    setSearch(ev.target.value);
                    // console.log(ev);
                  }}
                  // onBlur={() => combobox.closeDropdown()}
                  // onKeyDown={(event) => {
                  //   if (event.key === 'Backspace') {
                  //     event.preventDefault();
                  //     //handleValueRemove(value[value.length - 1]);
                  //   }
                  // }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>

        </Combobox.Target>
        <Combobox.Dropdown ref={ref}>
          <Combobox.Options>
            {loading ? <Combobox.Empty>Loading....</Combobox.Empty> : options}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </>
  );
}