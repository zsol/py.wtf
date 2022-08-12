"""
This is a test package.

Please don't use it in production.
"""

from .core import *
from foo import bar

from .core import Helper

__all__ = ["bar", "core_main", "Helper"]
