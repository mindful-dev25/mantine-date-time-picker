import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import {
  ActionIcon,
  ActionIconProps,
  BoxProps,
  factory,
  Factory,
  Group,
  InputVariant,
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

const CHEVRON_H = 28;
const INPUT_H = 48;
const COL_W = 56;
const SEP_W = 22;

function ChevronBtn({
  direction,
  onClick,
  stopPropagation,
}: {
  direction: 'up' | 'down';
  onClick: () => void;
  stopPropagation?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = direction === 'up' ? IconChevronUp : IconChevronDown;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-mantine-stop-propagation={stopPropagation || undefined}
      style={{
        width: COL_W,
        height: CHEVRON_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: 'var(--mantine-radius-sm)',
        color: hovered ? 'var(--mantine-color-text)' : 'var(--mantine-color-dimmed)',
        transition: 'color 120ms ease',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <Icon size={14} stroke={2.5} />
    </div>
  );
}

interface TimeWheelProps {
  ariaLabel: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  stopPropagation?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

function TimeWheel({ ariaLabel, value, max, onChange, stopPropagation, inputRef }: TimeWheelProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const prev = ((value - 1) + (max + 1)) % (max + 1);
  const next = (value + 1) % (max + 1);
  const displayValue = draft !== null ? draft : String(value).padStart(2, '0');

  const commit = (raw: string) => {
    const num = parseInt(raw || '0', 10);
    onChange(isNaN(num) ? 0 : Math.max(0, Math.min(max, num)));
    setDraft(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDraft(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0 && num <= max) onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setDraft(String(value).padStart(2, '0'));
    e.target.select();
  };

  const handleBlur = () => {
    commit(draft ?? '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDraft(null);
      onChange(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDraft(null);
      onChange(next);
    } else if (e.key === 'Enter') {
      commit(draft ?? '');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    onChange(e.deltaY > 0 ? next : prev);
  };

  return (
    <div
      onWheel={handleWheel}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <ChevronBtn
        direction="up"
        onClick={() => { setDraft(null); onChange(prev); }}
        stopPropagation={stopPropagation}
      />
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-mantine-stop-propagation={stopPropagation || undefined}
        style={{
          width: COL_W,
          height: INPUT_H,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '1.375rem',
          fontFamily: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          background: 'transparent',
          color: 'var(--mantine-color-text)',
          border: 'none',
          outline: 'none',
          cursor: 'text',
          transition: 'color 100ms ease',
        }}
      />
      <ChevronBtn
        direction="down"
        onClick={() => { setDraft(null); onChange(next); }}
        stopPropagation={stopPropagation}
      />
    </div>
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
  const hoursInputRef = useRef<HTMLInputElement>(null);

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
    if (date) setValue(assignTime(_value, date));
    hoursInputRef.current?.focus();
  };

  const handleTimeInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    timeInputProps?.onKeyDown?.(event);
    if (event.key === 'Enter') {
      event.preventDefault();
      dropdownHandlers.close();
    }
  };

  useDidUpdate(() => {
    if (!dropdownOpened) setTimeValue(formatTime(_value!));
  }, [_value, dropdownOpened]);

  useDidUpdate(() => {
    if (dropdownOpened) setCurrentLevel('month');
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

      {/* Visually hidden — kept for form integration and timeInputProps forwarding */}
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
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      {currentLevel === 'month' && (
        <div
          {...getStyles('timeWrapper')}
          role="group"
          aria-label="Time"
          style={{
            padding: '12px 16px 14px',
            background: 'var(--mantine-color-body)',
            borderTop: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {/* Labels row — phantom spacers mirror icon+button widths so columns stay aligned */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, flexShrink: 0 }} />
              <Group gap={0}>
                <Text size="9px" fw={700} tt="uppercase" c="dimmed" style={{ width: COL_W, textAlign: 'center', letterSpacing: '0.1em' }}>
                  Hours
                </Text>
                <div style={{ width: SEP_W }} />
                <Text size="9px" fw={700} tt="uppercase" c="dimmed" style={{ width: COL_W, textAlign: 'center', letterSpacing: '0.1em' }}>
                  Min
                </Text>
                {withSeconds && (
                  <>
                    <div style={{ width: SEP_W }} />
                    <Text size="9px" fw={700} tt="uppercase" c="dimmed" style={{ width: COL_W, textAlign: 'center', letterSpacing: '0.1em' }}>
                      Sec
                    </Text>
                  </>
                )}
              </Group>
              <div style={{ width: 36, flexShrink: 0 }} />
            </div>

            {/* Main row: icon + wheels + button — align-items center now uses only wheel height */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Clock badge */}
              <div
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconClock size={17} style={{ color: 'var(--mantine-color-dimmed)' }} aria-hidden="true" />
              </div>

              {/* Wheels with unified selection track */}
              <div style={{ position: 'relative' }}>
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: CHEVRON_H,
                    left: 0,
                    right: 0,
                    height: INPUT_H,
                    background: 'var(--mantine-color-default)',
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    pointerEvents: 'none',
                  }}
                />
                <Group gap={0} wrap="nowrap" align="center" style={{ position: 'relative', zIndex: 1 }}>
                  <TimeWheel
                    ariaLabel="Hours"
                    value={currentHours}
                    max={23}
                    onChange={(h) => applyTime(h, currentMinutes, currentSeconds)}
                    stopPropagation={__stopPropagation}
                    inputRef={hoursInputRef}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      width: SEP_W,
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      color: 'var(--mantine-color-dimmed)',
                      flexShrink: 0,
                    }}
                  >
                    :
                  </div>
                  <TimeWheel
                    ariaLabel="Minutes"
                    value={currentMinutes}
                    max={59}
                    onChange={(m) => applyTime(currentHours, m, currentSeconds)}
                    stopPropagation={__stopPropagation}
                  />
                  {withSeconds && (
                    <>
                      <div
                        aria-hidden="true"
                        style={{ width: SEP_W, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--mantine-color-dimmed)', flexShrink: 0 }}
                      >
                        :
                      </div>
                      <TimeWheel
                        ariaLabel="Seconds"
                        value={currentSeconds}
                        max={59}
                        onChange={(s) => applyTime(currentHours, currentMinutes, s)}
                        stopPropagation={__stopPropagation}
                      />
                    </>
                  )}
                </Group>
              </div>

              {/* Confirm button */}
              <ActionIcon
                variant="filled"
                size={36}
                radius="xl"
                aria-label="Confirm time selection"
                style={{ flexShrink: 0 }}
                data-mantine-stop-propagation={__stopPropagation || undefined}
                onClick={(event) => {
                  (submitButtonProps as any)?.onClick?.(event);
                  dropdownHandlers.close();
                }}
              >
                <IconCheck size={16} stroke={3} />
              </ActionIcon>
            </div>
          </div>
        </div>
      )}
    </PickerInputBase>
  );
});

DateTimePicker.classes = { ...classes, ...PickerInputBase.classes, ...DatePicker.classes };
DateTimePicker.displayName = '@mantine/dates/DateTimePicker';

export default DateTimePicker;
