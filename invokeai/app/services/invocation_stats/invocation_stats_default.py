import json
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import psutil
import torch

import invokeai.backend.util.logging as logger
from invokeai.app.invocations.baseinvocation import BaseInvocation
from invokeai.app.services.invocation_stats.invocation_stats_base import InvocationStatsServiceBase
from invokeai.app.services.invocation_stats.invocation_stats_common import (
    GESStatsNotFoundError,
    GraphExecutionStats,
    GraphExecutionStatsSummary,
    InvocationStatsSummary,
    ModelCacheStatsSummary,
    NodeExecutionStats,
    NodeExecutionStatsSummary,
)
from invokeai.app.services.invoker import Invoker
from invokeai.backend.model_manager.load.model_cache import CacheStats

# Size of 1GB in bytes.
GB = 2**30


class InvocationStatsService(InvocationStatsServiceBase):
    """Accumulate performance information about a running graph. Collects time spent in each node,
    as well as the maximum and current VRAM utilisation for CUDA systems"""

    def __init__(self):
        # Maps graph_execution_state_id to GraphExecutionStats.
        self._stats: dict[str, GraphExecutionStats] = {}
        # Maps graph_execution_state_id to model manager CacheStats.
        self._cache_stats: dict[str, CacheStats] = {}

    def start(self, invoker: Invoker) -> None:
        self._invoker = invoker

    @contextmanager
    def collect_stats(self, invocation: BaseInvocation, graph_execution_state_id: str) -> Generator[None, None, None]:
        # This is to handle case of the model manager not being initialized, which happens
        # during some tests.
        services = self._invoker.services
        if not self._stats.get(graph_execution_state_id):
            # First time we're seeing this graph_execution_state_id.
            self._stats[graph_execution_state_id] = GraphExecutionStats()
            self._cache_stats[graph_execution_state_id] = CacheStats()

        # Record state before the invocation.
        start_time = time.time()
        start_ram = psutil.Process().memory_info().rss
        if torch.cuda.is_available():
            torch.cuda.reset_peak_memory_stats()

        assert services.model_manager.load is not None
        services.model_manager.load.ram_cache.stats = self._cache_stats[graph_execution_state_id]

        try:
            # Let the invocation run.
            yield None
        finally:
            # Record state after the invocation.
            node_stats = NodeExecutionStats(
                invocation_type=invocation.get_type(),
                start_time=start_time,
                end_time=time.time(),
                start_ram_gb=start_ram / GB,
                end_ram_gb=psutil.Process().memory_info().rss / GB,
                peak_vram_gb=torch.cuda.max_memory_allocated() / GB if torch.cuda.is_available() else 0.0,
            )
            self._stats[graph_execution_state_id].add_node_execution_stats(node_stats)

    def reset_stats(self, graph_execution_state_id: str):
        self._stats.pop(graph_execution_state_id)
        self._cache_stats.pop(graph_execution_state_id)

    def get_stats(self, graph_execution_state_id: str) -> InvocationStatsSummary:
        graph_stats_summary = self._get_graph_summary(graph_execution_state_id)
        node_stats_summaries = self._get_node_summaries(graph_execution_state_id)
        model_cache_stats_summary = self._get_model_cache_summary(graph_execution_state_id)
        vram_usage_gb = torch.cuda.memory_allocated() / GB if torch.cuda.is_available() else None

        return InvocationStatsSummary(
            graph_stats=graph_stats_summary,
            model_cache_stats=model_cache_stats_summary,
            node_stats=node_stats_summaries,
            vram_usage_gb=vram_usage_gb,
        )

    def log_stats(self, graph_execution_state_id: str) -> None:
        stats = self.get_stats(graph_execution_state_id)
        logger.info(str(stats))

    def dump_stats(self, graph_execution_state_id: str, output_path: Path) -> None:
        stats = self.get_stats(graph_execution_state_id)
        with open(output_path, "w") as f:
            f.write(json.dumps(stats.as_dict(), indent=2))

    def _get_model_cache_summary(self, graph_execution_state_id: str) -> ModelCacheStatsSummary:
        try:
            cache_stats = self._cache_stats[graph_execution_state_id]
        except KeyError as e:
            raise GESStatsNotFoundError(
                f"Attempted to get model cache statistics for unknown graph {graph_execution_state_id}: {e}."
            ) from e

        return ModelCacheStatsSummary(
            cache_hits=cache_stats.hits,
            cache_misses=cache_stats.misses,
            high_water_mark_gb=cache_stats.high_watermark / GB,
            cache_size_gb=cache_stats.cache_size / GB,
            total_usage_gb=sum(list(cache_stats.loaded_model_sizes.values())) / GB,
            models_cached=cache_stats.in_cache,
            models_cleared=cache_stats.cleared,
        )

    def _get_graph_summary(self, graph_execution_state_id: str) -> GraphExecutionStatsSummary:
        try:
            graph_stats = self._stats[graph_execution_state_id]
        except KeyError as e:
            raise GESStatsNotFoundError(
                f"Attempted to get graph statistics for unknown graph {graph_execution_state_id}: {e}."
            ) from e

        return graph_stats.get_graph_stats_summary(graph_execution_state_id)

    def _get_node_summaries(self, graph_execution_state_id: str) -> list[NodeExecutionStatsSummary]:
        try:
            graph_stats = self._stats[graph_execution_state_id]
        except KeyError as e:
            raise GESStatsNotFoundError(
                f"Attempted to get node statistics for unknown graph {graph_execution_state_id}: {e}."
            ) from e

        return graph_stats.get_node_stats_summaries()
