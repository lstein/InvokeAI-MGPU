"""
Base class and implementation of a class that moves models in and out of VRAM.
"""

from typing import Dict, Optional

import torch

from invokeai.backend.model_manager import AnyModel
from invokeai.backend.model_manager.load.model_cache.model_cache_base import (
    CacheRecord,
    ModelCacheBase,
    ModelLockerBase,
)

MAX_GPU_WAIT = 600  # wait up to 10 minutes for a GPU to become free


class ModelLocker(ModelLockerBase):
    """Internal class that mediates movement in and out of GPU."""

    def __init__(self, cache: ModelCacheBase[AnyModel], cache_entry: CacheRecord[AnyModel]):
        """
        Initialize the model locker.

        :param cache: The ModelCache object
        :param cache_entry: The entry in the model cache
        """
        self._cache = cache
        self._cache_entry = cache_entry

    @property
    def model(self) -> AnyModel:
        """Return the model without moving it around."""
        return self._cache_entry.model

    def lock(self) -> AnyModel:
        """Move the model into the execution device (GPU) and lock it."""
        try:
            device = self._cache.get_execution_device()
            model_on_device = self._cache.model_to_device(self._cache_entry, device)
            self._cache.logger.debug(f"Moved {self._cache_entry.key} to {device}")
            self._cache.print_cuda_stats()
        except torch.cuda.OutOfMemoryError:
            self._cache.logger.warning("Insufficient GPU memory to load model. Aborting")
            raise
        except Exception:
            raise

        return model_on_device

    # It is no longer necessary to move the model out of VRAM
    # because it will be removed when it goes out of scope
    # in the caller's context
    def unlock(self) -> None:
        """Call upon exit from context."""
        self._cache.print_cuda_stats()

    # This is no longer in use in MGPU.
    def get_state_dict(self) -> Optional[Dict[str, torch.Tensor]]:
        """Return the state dict (if any) for the cached model."""
        return None
