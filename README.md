# Mantine Datetime Picker

[Mantine UI](https://mantine.dev) Datetime picker component.

## [Live Demo](https://mantine-datetime-picker.surge.sh)

## Installation

```bash
# With yarn
yarn add mantine-datetime-picker

# With npm
npm install mantine-datetime-picker
```

> Be sure to include Mantine core and dates CSS in your app:
>
> ```js
> import '@mantine/core/styles.css';
> import '@mantine/dates/styles.css';
> ```

#### PeerDependencies (Packages required or installed seperately)
1. @mantine/core
2. @mantine/dates
3. @mantine/hooks
4. @tabler/icons-react
5. dayjs
6. @emotion/react

### Props
1. It take all [DatePicker Props](https://mantine.dev/dates/date-picker/?t=props)

| prop        | type    | description                                   | default |
|-------------|---------|-----------------------------------------------|---------|
| hideNow     | boolean | Hide the `now` date&time button.       | false   |
| autoHideNow | boolean | Auto hide `now` button based on minDate and maxDate. `hideNow` will override this prop. | true    |
| nowLabel | string | Label for `Now` button | Now   |
| okLabel | string | Label for `Ok` button | Ok    |

## License

MIT