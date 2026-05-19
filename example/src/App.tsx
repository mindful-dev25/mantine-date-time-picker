//@ts-ignore
import { DateTimePicker } from 'mantine-datetime-picker'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

function App() {
	return (
		<DateTimePicker
			// nowLabel={'Right Now'}
			// okLabel={'Done Ok'}
			label="Mantine DateTime Picker"
			placeholder="Pick date time"
			defaultValue={new Date()}
		/>
	)
}

export default App
