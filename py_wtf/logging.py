import logging
from pathlib import Path

import rich.logging
from appdirs import user_log_dir


def setup_logging(level: int | None = None, to_file: bool = False) -> None:
    if level is None:
        level = logging.ERROR

    handler: logging.Handler = rich.logging.RichHandler()
    if to_file:
        dir = Path(user_log_dir("py.wtf"))
        dir.mkdir(exist_ok=True, parents=True)
        handler = logging.FileHandler(dir / "indexer.log")

    logging.basicConfig(level=level, handlers=[handler], force=True)
