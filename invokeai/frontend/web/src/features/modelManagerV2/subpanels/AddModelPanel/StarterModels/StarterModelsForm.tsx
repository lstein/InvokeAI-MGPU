import { Flex } from '@invoke-ai/ui-library';
import { FetchingModelsLoader } from 'features/modelManagerV2/subpanels/ModelManagerPanel/FetchingModelsLoader';
import { memo } from 'react';
import { useGetStarterModelsQuery } from 'services/api/endpoints/models';

import { StarterModelsResults } from './StarterModelsResults';

export const StarterModelsForm = memo(() => {
  const { isLoading, data } = useGetStarterModelsQuery();

  return (
    <Flex flexDir="column" height="100%" gap={3}>
      {isLoading && <FetchingModelsLoader loadingMessage="Loading Embeddings..." />}
      {data && <StarterModelsResults results={data} />}
    </Flex>
  );
});

StarterModelsForm.displayName = 'StarterModelsForm';
