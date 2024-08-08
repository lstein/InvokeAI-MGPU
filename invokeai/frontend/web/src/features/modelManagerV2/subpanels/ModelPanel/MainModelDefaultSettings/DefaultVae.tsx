import type { ComboboxOnChange } from '@invoke-ai/ui-library';
import { Combobox, Flex, FormControl, FormLabel } from '@invoke-ai/ui-library';
import { skipToken } from '@reduxjs/toolkit/query';
import { useAppSelector } from 'app/store/storeHooks';
import { InformationalPopover } from 'common/components/InformationalPopover/InformationalPopover';
import { SettingToggle } from 'features/modelManagerV2/subpanels/ModelPanel/SettingToggle';
import { memo, useCallback, useMemo } from 'react';
import type { UseControllerProps } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useGetModelConfigQuery } from 'services/api/endpoints/models';
import { useVAEModels } from 'services/api/hooks/modelsByType';

import type { MainModelDefaultSettingsFormData } from './MainModelDefaultSettings';

type DefaultVaeType = MainModelDefaultSettingsFormData['vae'];

export const DefaultVae = memo((props: UseControllerProps<MainModelDefaultSettingsFormData>) => {
  const { t } = useTranslation();
  const { field } = useController(props);
  const selectedModelKey = useAppSelector((s) => s.modelmanagerV2.selectedModelKey);
  const { data: modelData } = useGetModelConfigQuery(selectedModelKey ?? skipToken);

  const [vaeModels] = useVAEModels();
  const compatibleOptions = useMemo(() => {
    const compatibleOptions = vaeModels
      .filter((vae) => vae.base === modelData?.base)
      .map((vae) => ({ label: vae.name, value: vae.key }));

    const defaultOption = { label: 'Default VAE', value: 'default' };

    return [defaultOption, ...compatibleOptions];
  }, [modelData?.base, vaeModels]);

  const onChange = useCallback<ComboboxOnChange>(
    (v) => {
      const newValue = !v?.value ? 'default' : v.value;

      const updatedValue = {
        ...(field.value as DefaultVaeType),
        value: newValue,
      };
      field.onChange(updatedValue);
    },
    [field]
  );

  const value = useMemo(() => {
    return compatibleOptions.find((vae) => vae.value === (field.value as DefaultVaeType).value);
  }, [compatibleOptions, field.value]);

  const isDisabled = useMemo(() => {
    return !(field.value as DefaultVaeType).isEnabled;
  }, [field.value]);

  return (
    <FormControl flexDir="column" gap={2} alignItems="flex-start">
      <Flex justifyContent="space-between" w="full">
        <InformationalPopover feature="paramVAE">
          <FormLabel>{t('modelManager.vae')}</FormLabel>
        </InformationalPopover>
        <SettingToggle control={props.control} name="vae" />
      </Flex>
      <Combobox isDisabled={isDisabled} value={value} options={compatibleOptions} onChange={onChange} />
    </FormControl>
  );
});

DefaultVae.displayName = 'DefaultVae';
