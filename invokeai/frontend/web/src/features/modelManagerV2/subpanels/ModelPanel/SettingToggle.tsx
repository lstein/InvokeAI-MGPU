import { Switch, typedMemo } from '@invoke-ai/ui-library';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo } from 'react';
import type { UseControllerProps } from 'react-hook-form';
import { useController } from 'react-hook-form';

import type { FormField } from './MainModelDefaultSettings/MainModelDefaultSettings';

export const SettingToggle = typedMemo(<T, F extends Record<string, FormField<T>>>(props: UseControllerProps<F>) => {
  const { field } = useController(props);

  const value = useMemo(() => {
    return !!(field.value as FormField<T>).isEnabled;
  }, [field.value]);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const updatedValue: FormField<T> = {
        ...(field.value as FormField<T>),
        isEnabled: e.target.checked,
      };
      field.onChange(updatedValue);
    },
    [field]
  );

  return <Switch size="sm" isChecked={value} onChange={onChange} />;
});

SettingToggle.displayName = 'SettingToggle';
