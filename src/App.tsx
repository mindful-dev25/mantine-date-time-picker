import React from "react";
import { Box, MantineProvider } from "@mantine/core";
import DateTimePicker from "./components/DateTimePicker";
import { DatesProvider } from "@mantine/dates";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

function App() {
  return (
    <MantineProvider>
      <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 0, weekendDays: [0], timezone: 'UTC' }}>
        <Box p="md">
          <DateTimePicker
            label="Date Time Picker"
            placeholder="Pick date time"
            defaultValue={new Date()}
          />
        </Box>
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;
