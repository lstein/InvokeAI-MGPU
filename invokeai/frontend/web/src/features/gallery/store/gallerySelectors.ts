import type { SkipToken } from '@reduxjs/toolkit/query';
import { skipToken } from '@reduxjs/toolkit/query';
import { createMemoizedSelector } from 'app/store/createMemoizedSelector';
import { selectGallerySlice } from 'features/gallery/store/gallerySlice';
import { ASSETS_CATEGORIES, IMAGE_CATEGORIES } from 'features/gallery/store/types';
import type { ListBoardsArgs, ListImagesArgs } from 'services/api/types';

export const selectLastSelectedImage = createMemoizedSelector(
  selectGallerySlice,
  (gallery) => gallery.selection[gallery.selection.length - 1]
);

export const selectListImagesQueryArgs = createMemoizedSelector(
  selectGallerySlice,
  (gallery): ListImagesArgs | SkipToken =>
    gallery.limit
      ? {
          board_id: gallery.selectedBoardId,
          categories: gallery.galleryView === 'images' ? IMAGE_CATEGORIES : ASSETS_CATEGORIES,
          offset: gallery.offset,
          limit: gallery.limit,
          is_intermediate: false,
          starred_first: gallery.starredFirst,
          order_dir: gallery.orderDir,
          search_term: gallery.searchTerm,
        }
      : skipToken
);

export const selectListBoardsQueryArgs = createMemoizedSelector(
  selectGallerySlice,
  (gallery): ListBoardsArgs => ({
    include_archived: gallery.shouldShowArchivedBoards ? true : undefined,
  })
);
