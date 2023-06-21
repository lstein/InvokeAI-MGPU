import { socketConnected } from 'services/events/actions';
import { startAppListening } from '..';
import { createSelector } from '@reduxjs/toolkit';
import { generationSelector } from 'features/parameters/store/generationSelectors';
import { canvasSelector } from 'features/canvas/store/canvasSelectors';
import { nodesSelecter } from 'features/nodes/store/nodesSlice';
import { controlNetSelector } from 'features/controlNet/store/controlNetSlice';
import { ImageDTO } from 'services/api';
import { forEach, uniqBy } from 'lodash-es';
import { imageUrlsReceived } from 'services/thunks/image';
import { log } from 'app/logging/useLogger';
import { selectImagesEntities } from 'features/gallery/store/imagesSlice';

const moduleLog = log.child({ namespace: 'images' });

const selectAllUsedImages = createSelector(
  [
    generationSelector,
    canvasSelector,
    nodesSelecter,
    controlNetSelector,
    selectImagesEntities,
  ],
  (generation, canvas, nodes, controlNet, imageEntities) => {
    const allUsedImages: string[] = [];

    if (generation.initialImage) {
      allUsedImages.push(generation.initialImage);
    }

    canvas.layerState.objects.forEach((obj) => {
      if (obj.kind === 'image') {
        allUsedImages.push(obj.image.image_name);
      }
    });

    nodes.nodes.forEach((node) => {
      forEach(node.data.inputs, (input) => {
        if (input.type === 'image' && input.value) {
          allUsedImages.push(input.value.image_name);
        }
      });
    });

    forEach(controlNet.controlNets, (c) => {
      if (c.controlImage) {
        allUsedImages.push(c.controlImage.image_name);
      }
      if (c.processedControlImage) {
        allUsedImages.push(c.processedControlImage.image_name);
      }
    });

    forEach(imageEntities, (image) => {
      if (image) {
        allUsedImages.push(image.image_name);
      }
    });

    const uniqueImages = uniqBy(allUsedImages, 'image_name');

    return uniqueImages;
  }
);

export const addUpdateImageUrlsOnConnectListener = () => {
  startAppListening({
    actionCreator: socketConnected,
    effect: async (action, { dispatch, getState, take }) => {
      const state = getState();

      if (!state.config.shouldUpdateImagesOnConnect) {
        return;
      }

      const allUsedImages = selectAllUsedImages(state);

      moduleLog.trace(
        { data: allUsedImages },
        `Fetching new image URLs for ${allUsedImages.length} images`
      );

      allUsedImages.forEach((image_name) => {
        dispatch(
          imageUrlsReceived({
            imageName: image_name,
          })
        );
      });
    },
  });
};
