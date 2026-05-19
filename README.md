# Mantine DateTime Picker

A DateTime picker component for [Mantine UI](https://mantine.dev) combining a calendar and a scroll-wheel time selector.

## [Live Demo](https://datetime-picker-demo.surge.sh)

## Installation

```bash
# npm
npm install mantine-datetime-picker

# yarn
yarn add mantine-datetime-picker
```

Include Mantine styles in your app entry point:

```js
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
```

## Usage

```tsx
import { DateTimePicker } from 'mantine-datetime-picker';

function Demo() {
  return (
    <DateTimePicker
      label="Pick a date and time"
      placeholder="DD/MM/YYYY HH:mm"
    />
  );
}
```

## Props

Accepts all [DatePicker props](https://mantine.dev/dates/date-picker/?t=props) plus the following:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date \| null` | — | Controlled value |
| `defaultValue` | `Date \| null` | — | Initial value for uncontrolled usage |
| `onChange` | `(value: Date \| null) => void` | — | Called when the value changes |
| `valueFormat` | `string` | `"DD/MM/YYYY HH:mm"` | [Dayjs format](https://day.js.org/docs/en/display/format) for the input display value |
| `withSeconds` | `boolean` | `false` | Show a seconds wheel in the time picker |
| `timeInputProps` | `TimeInputProps` | — | Props forwarded to the hidden `TimeInput` (for form integration) |
| `submitButtonProps` | `ActionIconProps` | — | Props forwarded to the confirm button |
| `w` | `number \| string` | `"fit-content"` | Input width — override with a fixed value for full-width layouts |

## Peer dependencies

These packages must be installed in your project:

| Package | Version |
|---------|---------|
| `@mantine/core` | `^7.12.1` |
| `@mantine/dates` | `^7.12.1` |
| `@mantine/hooks` | `^7.12.1` |
| `@tabler/icons-react` | `^2.4.0` |
| `dayjs` | `^1.11.7` |
| `react` | `^18.2.0` |

## License

MIT
