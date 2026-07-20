#!/usr/bin/env python3
"""
错误处理模块
提供重试机制、错误日志、断点续传功能
"""

import time
import json
import functools
from typing import Callable, Any, Optional, Dict
from pathlib import Path


class RetryLimitExceeded(Exception):
    """重试次数超限异常"""
    pass


class ErrorLogger:
    """错误日志记录器"""

    def __init__(self, log_file: str = './error_log.json'):
        """
        初始化错误日志记录器

        参数:
            log_file: 日志文件路径
        """
        self.log_file = log_file
        self.errors = []
        self._load_errors()

    def _load_errors(self):
        """加载历史错误日志"""
        if Path(self.log_file).exists():
            try:
                with open(self.log_file, 'r', encoding='utf-8') as f:
                    self.errors = json.load(f)
            except:
                self.errors = []

    def _save_errors(self):
        """保存错误日志"""
        with open(self.log_file, 'w', encoding='utf-8') as f:
            json.dump(self.errors, f, indent=2, ensure_ascii=False)

    def log_error(self, error: Any, context: Optional[Dict[str, Any]] = None):
        """
        记录错误

        参数:
            error: 异常对象或错误消息字符串
            context: 错误上下文信息(可选)
        """
        if context is None:
            context = {}
            
        error_entry = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'error_type': type(error).__name__ if isinstance(error, Exception) else "Error",
            'error_message': str(error),
            'context': context
        }

        self.errors.append(error_entry)
        self._save_errors()

        # 打印错误信息
        print(f"\n❌ 错误发生:")
        print(f"   类型: {error_entry['error_type']}")
        print(f"   信息: {error_entry['error_message']}")
        print(f"   时间: {error_entry['timestamp']}")
        if context:
            print(f"   上下文: {context}")
        print(f"\n错误已记录到: {self.log_file}\n")

    def get_errors(self, error_type: Optional[str] = None) -> list:
        """
        获取错误记录

        参数:
            error_type: 错误类型过滤,None表示返回所有错误

        返回:
            错误记录列表
        """
        if error_type:
            return [e for e in self.errors if e['error_type'] == error_type]
        return self.errors

    def clear_errors(self):
        """清空错误日志"""
        self.errors = []
        self._save_errors()

    def log_info(self, msg: str):
        """记录常规信息"""
        print(f"ℹ️  [INFO] {msg}")

    def log_warning(self, msg: str):
        """记录警告信息"""
        print(f"⚠️  [WARN] {msg}")


def retry_on_failure(
    max_retries: int = 2,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple = (Exception,),
    error_logger: Optional[ErrorLogger] = None,
    context: Optional[Dict[str, Any]] = None
):
    """
    重试装饰器

    参数:
        max_retries: 最大重试次数,默认2次
        delay: 初始延迟时间(秒)
        backoff: 延迟增长因子
        exceptions: 需要重试的异常类型
        error_logger: 错误日志记录器
        context: 错误上下文信息

    返回:
        装饰器函数
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            retry_count = 0
            last_exception = None

            while retry_count < max_retries:
                try:
                    return func(*args, **kwargs)

                except exceptions as e:
                    retry_count += 1
                    last_exception = e

                    if retry_count <= max_retries:
                        # 计算延迟时间
                        current_delay = delay * (backoff ** (retry_count - 1))
                        print(f"⚠️  尝试 {retry_count}/{max_retries} 失败, {current_delay:.1f}秒后重试...")
                        print(f"   错误: {str(e)}\n")
                        time.sleep(current_delay)
                    else:
                        # 记录错误日志
                        if error_logger:
                            error_context = {
                                'function': func.__name__,
                                'args': str(args),
                                'kwargs': str(kwargs),
                                'retry_count': retry_count
                            }
                            if context:
                                error_context.update(context)
                            error_logger.log_error(e, error_context)

                        # 抛出异常
                        print(f"\n❌ 重试次数已达到上限 ({max_retries}次)")
                        print(f"   函数: {func.__name__}")
                        print(f"   最终错误: {str(e)}\n")
                        raise RetryLimitExceeded(
                            f"函数 {func.__name__} 在 {max_retries} 次重试后仍然失败"
                        ) from e

        return wrapper
    return decorator


class CheckpointManager:
    """检查点管理器,支持断点续传"""

    def __init__(self, checkpoint_file: str = './checkpoint.json'):
        """
        初始化检查点管理器

        参数:
            checkpoint_file: 检查点文件路径
        """
        self.checkpoint_file = checkpoint_file
        self.checkpoints = {}
        self._load_checkpoints()

    def _load_checkpoints(self):
        """加载检查点"""
        if Path(self.checkpoint_file).exists():
            try:
                with open(self.checkpoint_file, 'r', encoding='utf-8') as f:
                    self.checkpoints = json.load(f)
            except:
                self.checkpoints = {}

    def _save_checkpoints(self):
        """保存检查点"""
        with open(self.checkpoint_file, 'w', encoding='utf-8') as f:
            json.dump(self.checkpoints, f, indent=2, ensure_ascii=False)

    def save_checkpoint(self, key: str, data: Any):
        """
        保存检查点

        参数:
            key: 检查点键
            data: 检查点数据
        """
        self.checkpoints[key] = {
            'data': data,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self._save_checkpoints()
        print(f"✅ 检查点已保存: {key}")

    def load_checkpoint(self, key: str) -> Optional[Any]:
        """
        加载检查点

        参数:
            key: 检查点键

        返回:
            检查点数据,不存在返回None
        """
        if key in self.checkpoints:
            print(f"✅ 检查点已加载: {key}")
            return self.checkpoints[key]['data']
        return None

    def has_checkpoint(self, key: str) -> bool:
        """
        检查是否存在检查点

        参数:
            key: 检查点键

        返回:
            是否存在
        """
        return key in self.checkpoints

    def clear_checkpoint(self, key: str):
        """
        清除检查点

        参数:
            key: 检查点键
        """
        if key in self.checkpoints:
            del self.checkpoints[key]
            self._save_checkpoints()
            print(f"✅ 检查点已清除: {key}")

    def clear_all_checkpoints(self):
        """清除所有检查点"""
        self.checkpoints = {}
        self._save_checkpoints()
        print(f"✅ 所有检查点已清除")

    def list_checkpoints(self) -> list:
        """
        列出所有检查点

        返回:
            检查点键列表
        """
        return list(self.checkpoints.keys())


def safe_execute(
    func: Callable,
    *args,
    max_retries: int = 3,
    error_logger: Optional[ErrorLogger] = None,
    checkpoint_key: Optional[str] = None,
    checkpoint_manager: Optional[CheckpointManager] = None,
    **kwargs
) -> Any:
    """
    安全执行函数,包含重试、错误日志、检查点功能

    参数:
        func: 要执行的函数
        args: 位置参数
        max_retries: 最大重试次数
        error_logger: 错误日志记录器
        checkpoint_key: 检查点键
        checkpoint_manager: 检查点管理器
        kwargs: 关键字参数

    返回:
        函数执行结果
    """
    # 尝试从检查点加载
    if checkpoint_key and checkpoint_manager and checkpoint_manager.has_checkpoint(checkpoint_key):
        print(f"📍 发现检查点: {checkpoint_key}")
        choice = input("是否从检查点恢复? (y/n): ").lower()
        if choice == 'y':
            result = checkpoint_manager.load_checkpoint(checkpoint_key)
            print(f"✅ 已从检查点恢复\n")
            return result

    # 重试执行
    retry_count = 0
    last_exception = None

    while retry_count < max_retries:
        try:
            result = func(*args, **kwargs)

            # 保存检查点
            if checkpoint_key and checkpoint_manager:
                checkpoint_manager.save_checkpoint(checkpoint_key, result)

            return result

        except Exception as e:
            retry_count += 1
            last_exception = e

            if retry_count < max_retries:
                delay = 1.0 * (2.0 ** (retry_count - 1))
                print(f"⚠️  执行失败, {delay:.1f}秒后重试 ({retry_count}/{max_retries})")
                print(f"   错误: {str(e)}\n")
                time.sleep(delay)
            else:
                # 记录错误
                if error_logger:
                    error_logger.log_error(e, {
                        'function': func.__name__,
                        'args': str(args),
                        'kwargs': str(kwargs),
                        'retry_count': retry_count
                    })

                # 抛出异常
                print(f"\n❌ 执行失败,已达到最大重试次数 ({max_retries})")
                print(f"   函数: {func.__name__}")
                print(f"   错误: {str(e)}\n")
                raise


# 创建全局错误日志记录器
global_error_logger = ErrorLogger()

# 创建全局检查点管理器
global_checkpoint_manager = CheckpointManager()
