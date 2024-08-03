import { StickyScrollable } from 'features/system/components/StickyScrollable';
import { memo } from 'react';
import type { AnyModelConfig } from 'services/api/types';

import ModelListItem from './ModelListItem';

type ModelListWrapperProps = {
  title: string;
  modelList: AnyModelConfig[];
};

export const ModelListWrapper = memo((props: ModelListWrapperProps) => {
  const { title, modelList } = props;
  return (
    <StickyScrollable title={title} contentSx={{ gap: 1, p: 2 }}>
      {modelList.map((model) => (
        <ModelListItem key={model.key} model={model} />
      ))}
    </StickyScrollable>
  );
});

ModelListWrapper.displayName = 'ModelListWrapper';
