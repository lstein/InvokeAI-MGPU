import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { PersistConfig, RootState } from 'app/store/store';
import type { LogLevelName } from 'roarr';
import {
  socketConnected,
  socketDisconnected,
  socketGeneratorProgress,
  socketInvocationComplete,
  socketInvocationStarted,
  socketModelLoadComplete,
  socketModelLoadStarted,
  socketQueueItemStatusChanged,
} from 'services/events/actions';

import type { Language, SystemState } from './types';

const initialSystemState: SystemState = {
  _version: 1,
  isConnected: false,
  shouldConfirmOnDelete: true,
  enableImageDebugging: false,
  denoiseProgress: null,
  shouldAntialiasProgressImage: false,
  consoleLogLevel: 'debug',
  shouldLogToConsole: true,
  language: 'en',
  shouldUseNSFWChecker: false,
  shouldUseWatermarker: false,
  shouldEnableInformationalPopovers: true,
  status: 'DISCONNECTED',
  cancellations: [],
};

export const systemSlice = createSlice({
  name: 'system',
  initialState: initialSystemState,
  reducers: {
    setShouldConfirmOnDelete: (state, action: PayloadAction<boolean>) => {
      state.shouldConfirmOnDelete = action.payload;
    },
    setEnableImageDebugging: (state, action: PayloadAction<boolean>) => {
      state.enableImageDebugging = action.payload;
    },
    consoleLogLevelChanged: (state, action: PayloadAction<LogLevelName>) => {
      state.consoleLogLevel = action.payload;
    },
    shouldLogToConsoleChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldLogToConsole = action.payload;
    },
    shouldAntialiasProgressImageChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldAntialiasProgressImage = action.payload;
    },
    languageChanged: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    shouldUseNSFWCheckerChanged(state, action: PayloadAction<boolean>) {
      state.shouldUseNSFWChecker = action.payload;
    },
    shouldUseWatermarkerChanged(state, action: PayloadAction<boolean>) {
      state.shouldUseWatermarker = action.payload;
    },
    setShouldEnableInformationalPopovers(state, action: PayloadAction<boolean>) {
      state.shouldEnableInformationalPopovers = action.payload;
    },
  },
  extraReducers(builder) {
    /**
     * Socket Connected
     */
    builder.addCase(socketConnected, (state) => {
      state.isConnected = true;
      state.denoiseProgress = null;
      state.status = 'CONNECTED';
    });

    /**
     * Socket Disconnected
     */
    builder.addCase(socketDisconnected, (state) => {
      state.isConnected = false;
      state.denoiseProgress = null;
      state.status = 'DISCONNECTED';
    });

    /**
     * Invocation Started
     */
    builder.addCase(socketInvocationStarted, (state) => {
      state.cancellations = [];
      state.denoiseProgress = null;
      state.status = 'PROCESSING';
    });

    /**
     * Generator Progress
     */
    builder.addCase(socketGeneratorProgress, (state, action) => {
      const { step, total_steps, progress_image, session_id, batch_id, percentage } = action.payload.data;

      if (state.cancellations.includes(session_id)) {
        // Do not update the progress if this session has been cancelled. This prevents a race condition where we get a
        // progress update after the session has been cancelled.
        return;
      }

      state.denoiseProgress = {
        step,
        total_steps,
        percentage,
        progress_image,
        session_id,
        batch_id,
      };

      state.status = 'PROCESSING';
    });

    /**
     * Invocation Complete
     */
    builder.addCase(socketInvocationComplete, (state) => {
      state.denoiseProgress = null;
      state.status = 'CONNECTED';
    });

    builder.addCase(socketModelLoadStarted, (state) => {
      state.status = 'LOADING_MODEL';
    });

    builder.addCase(socketModelLoadComplete, (state) => {
      state.status = 'CONNECTED';
    });

    builder.addCase(socketQueueItemStatusChanged, (state, action) => {
      if (['completed', 'canceled', 'failed'].includes(action.payload.data.status)) {
        state.status = 'CONNECTED';
        state.denoiseProgress = null;
        state.cancellations.push(action.payload.data.session_id);
      }
    });
  },
});

export const {
  setShouldConfirmOnDelete,
  setEnableImageDebugging,
  consoleLogLevelChanged,
  shouldLogToConsoleChanged,
  shouldAntialiasProgressImageChanged,
  languageChanged,
  shouldUseNSFWCheckerChanged,
  shouldUseWatermarkerChanged,
  setShouldEnableInformationalPopovers,
} = systemSlice.actions;

export const selectSystemSlice = (state: RootState) => state.system;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const migrateSystemState = (state: any): any => {
  if (!('_version' in state)) {
    state._version = 1;
  }
  return state;
};

export const systemPersistConfig: PersistConfig<SystemState> = {
  name: systemSlice.name,
  initialState: initialSystemState,
  migrate: migrateSystemState,
  persistDenylist: ['isConnected', 'denoiseProgress', 'status', 'cancellations'],
};
