import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import {
  ActionIcon,
  ActionIconProps,
  Box,
  BoxProps,
  Button,
  factory,
  Factory,
  Group,
  InputVariant,
  Stack,
  StylesApiProps,
  Text,
  useProps,
  useResolvedStylesApi,
  useStyles,
} from '@mantine/core';
import {
  assignTime,
  CalendarBaseProps,
  CalendarSettings,
  CalendarStylesNames,
  DateInputSharedProps,
  DatePicker,
  DateValue,
  pickCalendarProps,
  PickerInputBase,
  PickerInputBaseStylesNames,
  shiftTimezone,
  TimeInput,
  TimeInputProps,
  useDatesContext,
} from '@mantine/dates';
import { useDidUpdate, useDisclosure, useMergedRef } from '@mantine/hooks';
import React from 'react';
import { IconCheck, IconChevronDown, IconChevronUp, IconClock } from '@tabler/icons-react';
import { useUncontrolledDates } from './useControlledDates';

export type DateTimePickerStylesNames =
  | 'timeWrapper'
  | 'timeInput'
  | 'submitButton'
  | PickerInputBaseStylesNames
  | CalendarStylesNames;

export interface DateTimePickerProps
  extends BoxProps,
    Omit<
      DateInputSharedProps,
      'classNames' | 'styles' | 'closeOnChange' | 'size' | 'valueFormatter'
    >,
    Omit<CalendarBaseProps, 'defaultDate'>,
    Omit<CalendarSettings, 'onYearMouseEnter' | 'onMonthMouseEnter'>,
    StylesApiProps<DateTimePickerFactory> {
  /** Dayjs format to display input value, "DD/MM/YYYY HH:mm" by default  */
  valueFormat?: string;

  /** Controlled component value */
  value?: DateValue;

  /** Default value for uncontrolled component */
  defaultValue?: DateValue;

  /** Called when value changes */
  onChange?: (value: DateValue) => void;

  /** TimeInput component props */
  timeInputProps?: TimeInputProps & { ref?: React.ComponentPropsWithRef<'input'>['ref'] };

  /** Props passed down to the submit button */
  submitButtonProps?: ActionIconProps & React.ComponentPropsWithoutRef<'button'>;

  /** Determines whether seconds input should be rendered */
  withSeconds?: boolean;
}

export type DateTimePickerFactory = Factory<{
  props: DateTimePickerProps;
  ref: HTMLButtonElement;
  stylesNames: DateTimePickerStylesNames;
  variant: InputVariant;
}>;

const defaultProps: Partial<DateTimePickerProps> = {
  dropdownType: 'popover',
};

const classes: Record<string, string> = {};

interface TimeColumnProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  stopPropagation?: boolean;
  incrementRef?: React.RefObject<HTMLButtonElement>;
}

function TimeColumn({ label, value, onIncrement, onDecrement, stopPropagation, incrementRef }: TimeColumnProps) {
  return (
    <Stack align="center" gap={4}>
      <Text
        size="10px"
        c="dimmed"
        fw={700}
        tt="uppercase"
        style={{ letterSpacing: '0.1em' }}
      >
        {label}
      </Text>
      <ActionIcon
        ref={incrementRef}
        variant="subtle"
        color="blue"
        size="sm"
        radius="xl"
        onClick={onIncrement}
        data-mantine-stop-propagation={stopPropagation || undefined}
      >
        <IconChevronUp size={14} stroke={2.5} />
      </ActionIcon>
      <Box
        style={{
          width: 52,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--mantine-color-blue-light)',
          borderRadius: 8,
          border: '1.5px solid var(--mantine-color-blue-light-hover)',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <Text
          fw={700}
          size="xl"
          c="blue.7"
          style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
        >
          {String(value).padStart(2, '0')}
        </Text>
      </Box>
      <ActionIcon
        variant="subtle"
        color="blue"
        size="sm"
        radius="xl"
        onClick={onDecrement}
        data-mantine-stop-propagation={stopPropagation || undefined}
      >
        <IconChevronDown size={14} stroke={2.5} />
      </ActionIcon>
    </Stack>
  );
}

const DateTimePicker = factory<DateTimePickerFactory>((_props, ref) => {
  const props = useProps('DateTimePicker', defaultProps, _props);
  const {
    value,
    defaultValue,
    onChange,
    valueFormat,
    locale,
    classNames,
    styles,
    unstyled,
    timeInputProps,
    submitButtonProps,
    withSeconds,
    level,
    defaultLevel,
    size,
    variant,
    dropdownType,
    vars,
    minDate,
    maxDate,
    ...rest
  } = props;

  const getStyles = useStyles<DateTimePickerFactory>({
    name: 'DateTimePicker',
    classes,
    props,
    classNames,
    styles,
    unstyled,
    vars,
  });

  const { resolvedClassNames, resolvedStyles } = useResolvedStylesApi<DateTimePickerFactory>({
    classNames,
    styles,
    props,
  });

  const _valueFormat = valueFormat || (withSeconds ? 'DD/MM/YYYY HH:mm:ss' : 'DD/MM/YYYY HH:mm');

  const timeInputRef = useRef<HTMLInputElement>();
  const timeInputRefMerged = useMergedRef(timeInputRef, timeInputProps?.ref);
  const hoursIncrementRef = useRef<HTMLButtonElement>(null);

  const {
    calendarProps: { allowSingleDateInRange, ...calendarProps },
    others,
  } = pickCalendarProps(rest);

  const ctx = useDatesContext();
  const [_value, setValue] = useUncontrolledDates({
    type: 'default',
    value,
    defaultValue,
    onChange,
  });

  const formatTime = (dateValue: Date) =>
    dateValue ? dayjs(dateValue).format(withSeconds ? 'HH:mm:ss' : 'HH:mm') : '';

  const [timeValue, setTimeValue] = useState(formatTime(_value!));
  const [currentLevel, setCurrentLevel] = useState(level || defaultLevel || 'month');

  const [dropdownOpened, dropdownHandlers] = useDisclosure(false);
  const formattedValue = _value
    ? dayjs(_value).locale(ctx.getLocale(locale)).format(_valueFormat)
    : '';

  const currentHours = timeValue ? parseInt(timeValue.split(':')[0], 10) || 0 : 0;
  const currentMinutes = timeValue ? parseInt(timeValue.split(':')[1], 10) || 0 : 0;
  const currentSeconds = timeValue ? parseInt(timeValue.split(':')[2] || '0', 10) || 0 : 0;

  const applyTime = (h: number, m: number, s: number) => {
    const timeStr = withSeconds
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setTimeValue(timeStr);
    const timeDate = shiftTimezone('add', new Date(), ctx.getTimezone());
    timeDate.setHours(h);
    timeDate.setMinutes(m);
    timeDate.setSeconds(s);
    setValue(assignTime(timeDate, _value || shiftTimezone('add', new Date(), ctx.getTimezone())));
  };

  const adjustHours = (delta: number) => {
    applyTime(((currentHours + delta) % 24 + 24) % 24, currentMinutes, currentSeconds);
  };

  const adjustMinutes = (delta: number) => {
    applyTime(currentHours, ((currentMinutes + delta) % 60 + 60) % 60, currentSeconds);
  };

  const adjustSeconds = (delta: number) => {
    applyTime(currentHours, currentMinutes, ((currentSeconds + delta) % 60 + 60) % 60);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    timeInputProps?.onChange?.(event);
    const val = event.currentTarget.value;
    setTimeValue(val);

    if (val) {
      const [hours, minutes, seconds] = val.split(':').map(Number);
      const timeDate = shiftTimezone('add', new Date(), ctx.getTimezone());
      timeDate.setHours(hours);
      timeDate.setMinutes(minutes);
      timeDate.setSeconds(seconds || 0);
      setValue(assignTime(timeDate, _value || shiftTimezone('add', new Date(), ctx.getTimezone())));
    }
  };

  const handleDateChange = (date: DateValue) => {
    if (date) {
      setValue(assignTime(_value, date));
    }
    hoursIncrementRef.current?.focus();
  };

  const handleTimeInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    timeInputProps?.onKeyDown?.(event);
    if (event.key === 'Enter') {
      event.preventDefault();
      dropdownHandlers.close();
    }
  };

  useDidUpdate(() => {
    if (!dropdownOpened) {
      setTimeValue(formatTime(_value!));
    }
  }, [_value, dropdownOpened]);

  useDidUpdate(() => {
    if (dropdownOpened) {
      setCurrentLevel('month');
    }
  }, [dropdownOpened]);

  const minTime = minDate ? dayjs(minDate).format('HH:mm:ss') : null;
  const maxTime = maxDate ? dayjs(maxDate).format('HH:mm:ss') : null;

  const __stopPropagation = dropdownType === 'popover';

  return (
    <PickerInputBase
      formattedValue={formattedValue}
      dropdownOpened={dropdownOpened}
      dropdownHandlers={dropdownHandlers}
      classNames={resolvedClassNames}
      styles={resolvedStyles}
      unstyled={unstyled}
      ref={ref}
      onClear={() => setValue(null)}
      shouldClear={!!_value}
      value={_value}
      size={size!}
      variant={variant}
      dropdownType={dropdownType}
      {...others}
      type="default"
      __staticSelector="DateTimePicker"
    >
      <DatePicker
        {...calendarProps}
        maxDate={maxDate}
        minDate={minDate}
        size={size}
        variant={variant}
        type="default"
        value={_value}
        defaultDate={_value!}
        onChange={handleDateChange}
        locale={locale}
        classNames={resolvedClassNames}
        styles={resolvedStyles}
        unstyled={unstyled}
        __staticSelector="DateTimePicker"
        __stopPropagation={__stopPropagation}
        level={level}
        defaultLevel={defaultLevel}
        onLevelChange={(_level) => {
          setCurrentLevel(_level);
          calendarProps.onLevelChange?.(_level);
        }}
        __timezoneApplied
      />

      {/* Hidden TimeInput kept for ref and form integration */}
      <TimeInput
        value={timeValue}
        withSeconds={withSeconds}
        ref={timeInputRefMerged}
        unstyled={unstyled}
        minTime={
          _value && minDate && _value.toDateString() === minDate.toDateString()
            ? minTime != null ? minTime : undefined
            : undefined
        }
        maxTime={
          _value && maxDate && _value.toDateString() === maxDate.toDateString()
            ? maxTime != null ? maxTime : undefined
            : undefined
        }
        {...timeInputProps}
        {...getStyles('timeInput', {
          className: timeInputProps?.className,
          style: timeInputProps?.style,
        })}
        onChange={handleTimeChange}
        onKeyDown={handleTimeInputKeyDown}
        size={size}
        data-mantine-stop-propagation={__stopPropagation || undefined}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      />

      {currentLevel === 'month' && (
        <div
          {...getStyles('timeWrapper')}
          style={{
            padding: '12px 16px 14px',
            borderTop: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Stack gap="xs">
            <Group justify="center" gap={6}>
              <IconClock size={13} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text
                size="xs"
                c="dimmed"
                fw={600}
                tt="uppercase"
                style={{ letterSpacing: '0.06em' }}
              >
                Set Time
              </Text>
            </Group>

            <Group justify="center" align="flex-end" gap="xs">
              <TimeColumn
                label="Hours"
                value={currentHours}
                onIncrement={() => adjustHours(1)}
                onDecrement={() => adjustHours(-1)}
                stopPropagation={__stopPropagation}
                incrementRef={hoursIncrementRef}
              />

              <Text
                fw={800}
                size="xl"
                c="blue.4"
                style={{ paddingBottom: 14, lineHeight: 1 }}
              >
                :
              </Text>

              <TimeColumn
                label="Minutes"
                value={currentMinutes}
                onIncrement={() => adjustMinutes(1)}
                onDecrement={() => adjustMinutes(-1)}
                stopPropagation={__stopPropagation}
              />

              {withSeconds && (
                <>
                  <Text
                    fw={800}
                    size="xl"
                    c="blue.4"
                    style={{ paddingBottom: 14, lineHeight: 1 }}
                  >
                    :
                  </Text>
                  <TimeColumn
                    label="Seconds"
                    value={currentSeconds}
                    onIncrement={() => adjustSeconds(1)}
                    onDecrement={() => adjustSeconds(-1)}
                    stopPropagation={__stopPropagation}
                  />
                </>
              )}
            </Group>

            <Button
              fullWidth
              size="xs"
              variant="light"
              color="blue"
              radius="md"
              leftSection={<IconCheck size={13} stroke={2.5} />}
              data-mantine-stop-propagation={__stopPropagation || undefined}
              onClick={(event) => {
                (submitButtonProps as any)?.onClick?.(event);
                dropdownHandlers.close();
              }}
            >
              Confirm
            </Button>
          </Stack>
        </div>
      )}
    </PickerInputBase>
  );
});

DateTimePicker.classes = { ...classes, ...PickerInputBase.classes, ...DatePicker.classes };
DateTimePicker.displayName = '@mantine/dates/DateTimePicker';

export default DateTimePicker;
