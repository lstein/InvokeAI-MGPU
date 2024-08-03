import { createAction } from '@reduxjs/toolkit';
import { logger } from 'app/logging/logger';
import type { AppStartListening } from 'app/store/middleware/listenerMiddleware';
import { parseify } from 'common/util/serialize';
import { buildAdHocPostProcessingGraph } from 'features/nodes/util/graph/buildAdHocPostProcessingGraph';
import { toast } from 'features/toast/toast';
import { t } from 'i18next';
import { queueApi } from 'services/api/endpoints/queue';
import type { BatchConfig, ImageDTO } from 'services/api/types';

export const adHocPostProcessingRequested = createAction<{ imageDTO: ImageDTO }>(`upscaling/postProcessingRequested`);

export const addAdHocPostProcessingRequestedListener = (startAppListening: AppStartListening) => {
  startAppListening({
    actionCreator: adHocPostProcessingRequested,
    effect: async (action, { dispatch, getState }) => {
      const log = logger('session');

      const { imageDTO } = action.payload;
      const state = getState();

      const enqueueBatchArg: BatchConfig = {
        prepend: true,
        batch: {
          graph: await buildAdHocPostProcessingGraph({
            image: imageDTO,
            state,
          }),
          runs: 1,
        },
      };

      try {
        const req = dispatch(
          queueApi.endpoints.enqueueBatch.initiate(enqueueBatchArg, {
            fixedCacheKey: 'enqueueBatch',
          })
        );

        const enqueueResult = await req.unwrap();
        req.reset();
        log.debug({ enqueueResult: parseify(enqueueResult) }, t('queue.graphQueued'));
      } catch (error) {
        log.error({ enqueueBatchArg: parseify(enqueueBatchArg) }, t('queue.graphFailedToQueue'));

        if (error instanceof Object && 'status' in error && error.status === 403) {
          return;
        } else {
          toast({
            id: 'GRAPH_QUEUE_FAILED',
            title: t('queue.graphFailedToQueue'),
            status: 'error',
          });
        }
      }
    },
  });
};
