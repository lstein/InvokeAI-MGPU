import { CompositeNumberInput, CompositeSlider, Flex, FormControl, FormLabel } from '@invoke-ai/ui-library';
import { useAppSelector } from 'app/store/storeHooks';
import { InformationalPopover } from 'common/components/InformationalPopover/InformationalPopover';
import { SettingToggle } from 'features/modelManagerV2/subpanels/ModelPanel/SettingToggle';
import { memo, useCallback, useMemo } from 'react';
import type { UseControllerProps } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { MainModelDefaultSettingsFormData } from './MainModelDefaultSettings';

type DefaultCfgRescaleMultiplierType = MainModelDefaultSettingsFormData['cfgRescaleMultiplier'];

export const DefaultCfgRescaleMultiplier = memo((props: UseControllerProps<MainModelDefaultSettingsFormData>) => {
  const { field } = useController(props);

  const sliderMin = useAppSelector((s) => s.config.sd.cfgRescaleMultiplier.sliderMin);
  const sliderMax = useAppSelector((s) => s.config.sd.cfgRescaleMultiplier.sliderMax);
  const numberInputMin = useAppSelector((s) => s.config.sd.cfgRescaleMultiplier.numberInputMin);
  const numberInputMax = useAppSelector((s) => s.config.sd.cfgRescaleMultiplier.numberInputMax);
  const coarseStep = useAppSelector((s) => s.config.sd.cfgRescaleMultiplier.coarseStep);
  const fineStep = useAppSelector((s) => s.config.sd.cfgRescaleMultiplier.fineStep);
  const { t } = useTranslation();
  const marks = useMemo(() => [sliderMin, Math.floor(sliderMax / 2), sliderMax], [sliderMax, sliderMin]);

  const onChange = useCallback(
    (v: number) => {
      const updatedValue = {
        ...(field.value as DefaultCfgRescaleMultiplierType),
        value: v,
      };
      field.onChange(updatedValue);
    },
    [field]
  );

  const value = useMemo(() => {
    return (field.value as DefaultCfgRescaleMultiplierType).value;
  }, [field.value]);

  const isDisabled = useMemo(() => {
    return !(field.value as DefaultCfgRescaleMultiplierType).isEnabled;
  }, [field.value]);

  return (
    <FormControl flexDir="column" gap={2} alignItems="flex-start">
      <Flex justifyContent="space-between" w="full">
        <InformationalPopover feature="paramCFGRescaleMultiplier">
          <FormLabel>{t('parameters.cfgRescaleMultiplier')}</FormLabel>
        </InformationalPopover>
        <SettingToggle control={props.control} name="cfgRescaleMultiplier" />
      </Flex>

      <Flex w="full" gap={4}>
        <CompositeSlider
          value={value}
          min={sliderMin}
          max={sliderMax}
          step={coarseStep}
          fineStep={fineStep}
          onChange={onChange}
          marks={marks}
          isDisabled={isDisabled}
        />
        <CompositeNumberInput
          value={value}
          min={numberInputMin}
          max={numberInputMax}
          step={coarseStep}
          fineStep={fineStep}
          onChange={onChange}
          isDisabled={isDisabled}
        />
      </Flex>
    </FormControl>
  );
});

DefaultCfgRescaleMultiplier.displayName = 'DefaultCfgRescaleMultiplier';
