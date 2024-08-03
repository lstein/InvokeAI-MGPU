// type-safe dnd from https://github.com/clauderic/dnd-kit/issues/935
import type {
  Active,
  Collision,
  DndContextProps,
  Over,
  Translate,
  useDraggable as useOriginalDraggable,
  UseDraggableArguments,
  useDroppable as useOriginalDroppable,
  UseDroppableArguments,
} from '@dnd-kit/core';
import type { BoardId } from 'features/gallery/store/types';
import type { FieldInputInstance, FieldInputTemplate } from 'features/nodes/types/field';
import type { ImageDTO } from 'services/api/types';

type BaseDropData = {
  id: string;
};

export type CurrentImageDropData = BaseDropData & {
  actionType: 'SET_CURRENT_IMAGE';
};

type ControlAdapterDropData = BaseDropData & {
  actionType: 'SET_CONTROL_ADAPTER_IMAGE';
  context: {
    id: string;
  };
};

export type CALayerImageDropData = BaseDropData & {
  actionType: 'SET_CA_LAYER_IMAGE';
  context: {
    layerId: string;
  };
};

export type IPALayerImageDropData = BaseDropData & {
  actionType: 'SET_IPA_LAYER_IMAGE';
  context: {
    layerId: string;
  };
};

export type RGLayerIPAdapterImageDropData = BaseDropData & {
  actionType: 'SET_RG_LAYER_IP_ADAPTER_IMAGE';
  context: {
    layerId: string;
    ipAdapterId: string;
  };
};

export type IILayerImageDropData = BaseDropData & {
  actionType: 'SET_II_LAYER_IMAGE';
  context: {
    layerId: string;
  };
};

export type CanvasInitialImageDropData = BaseDropData & {
  actionType: 'SET_CANVAS_INITIAL_IMAGE';
};

type UpscaleInitialImageDropData = BaseDropData & {
  actionType: 'SET_UPSCALE_INITIAL_IMAGE';
};

type NodesImageDropData = BaseDropData & {
  actionType: 'SET_NODES_IMAGE';
  context: {
    nodeId: string;
    fieldName: string;
  };
};

export type AddToBoardDropData = BaseDropData & {
  actionType: 'ADD_TO_BOARD';
  context: { boardId: string };
};

export type RemoveFromBoardDropData = BaseDropData & {
  actionType: 'REMOVE_FROM_BOARD';
};

export type SelectForCompareDropData = BaseDropData & {
  actionType: 'SELECT_FOR_COMPARE';
  context: {
    firstImageName?: string | null;
    secondImageName?: string | null;
  };
};

export type TypesafeDroppableData =
  | CurrentImageDropData
  | ControlAdapterDropData
  | CanvasInitialImageDropData
  | NodesImageDropData
  | AddToBoardDropData
  | RemoveFromBoardDropData
  | CALayerImageDropData
  | IPALayerImageDropData
  | RGLayerIPAdapterImageDropData
  | IILayerImageDropData
  | SelectForCompareDropData
  | UpscaleInitialImageDropData;

type BaseDragData = {
  id: string;
};

type NodeFieldDraggableData = BaseDragData & {
  payloadType: 'NODE_FIELD';
  payload: {
    nodeId: string;
    field: FieldInputInstance;
    fieldTemplate: FieldInputTemplate;
  };
};

export type ImageDraggableData = BaseDragData & {
  payloadType: 'IMAGE_DTO';
  payload: { imageDTO: ImageDTO };
};

export type GallerySelectionDraggableData = BaseDragData & {
  payloadType: 'GALLERY_SELECTION';
  payload: { boardId: BoardId };
};

export type TypesafeDraggableData = NodeFieldDraggableData | ImageDraggableData | GallerySelectionDraggableData;

export interface UseDroppableTypesafeArguments extends Omit<UseDroppableArguments, 'data'> {
  data?: TypesafeDroppableData;
}

export type UseDroppableTypesafeReturnValue = Omit<ReturnType<typeof useOriginalDroppable>, 'active' | 'over'> & {
  active: TypesafeActive | null;
  over: TypesafeOver | null;
};

export interface UseDraggableTypesafeArguments extends Omit<UseDraggableArguments, 'data'> {
  data?: TypesafeDraggableData;
}

export type UseDraggableTypesafeReturnValue = Omit<ReturnType<typeof useOriginalDraggable>, 'active' | 'over'> & {
  active: TypesafeActive | null;
  over: TypesafeOver | null;
};

interface TypesafeActive extends Omit<Active, 'data'> {
  data: React.MutableRefObject<TypesafeDraggableData | undefined>;
}

interface TypesafeOver extends Omit<Over, 'data'> {
  data: React.MutableRefObject<TypesafeDroppableData | undefined>;
}

interface DragEvent {
  activatorEvent: Event;
  active: TypesafeActive;
  collisions: Collision[] | null;
  delta: Translate;
  over: TypesafeOver | null;
}

export interface DragStartEvent extends Pick<DragEvent, 'active'> {}
interface DragMoveEvent extends DragEvent {}
interface DragOverEvent extends DragMoveEvent {}
export interface DragEndEvent extends DragEvent {}
interface DragCancelEvent extends DragEndEvent {}

export interface DndContextTypesafeProps
  extends Omit<DndContextProps, 'onDragStart' | 'onDragMove' | 'onDragOver' | 'onDragEnd' | 'onDragCancel'> {
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(event: DragCancelEvent): void;
}
