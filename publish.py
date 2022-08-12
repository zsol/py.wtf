#!/usr/bin/env python

import asyncio
import logging
import os
import shlex
import shutil
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

log = logging.getLogger()

NPM = "npm.cmd" if sys.platform == "win32" else "npm"


class CommandError(Exception):
    pass


async def shell(
    prog: str,
    *args: str,
    cwd: Path | None = None,
    additional_env: dict[str, str] | None = None,
) -> str:
    log.info(f"$ {shlex.join([prog, *args])}")
    env = os.environ.copy()
    if additional_env:
        env.update(additional_env)
    try:
        proc = await asyncio.create_subprocess_exec(
            prog,
            *args,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
    except FileNotFoundError as e:
        raise CommandError(f"Can't find command {prog} to run") from e
    out, err = await proc.communicate()
    if err:
        log.warning(f"{prog}: {err.decode()}")
    if proc.returncode:
        raise CommandError(
            f"Got exit code {proc.returncode} from command {shlex.join([prog, *args])}"
        )
    output = out.decode()
    log.debug(output)
    return output


PROJECTS_TO_INDEX = [
    "click",
    "aioitertools",
    "aiomultiprocess",
    "more_itertools",
    "usort",
    "black",
    "libcst",
    "numpy",
]


async def main() -> None:
    toplevel = Path(__file__).parent
    os.chdir(toplevel)
    await shell("hatch", "--version")
    await shell(NPM, "--version")
    await asyncio.gather(
        *[
            shell(
                "hatch",
                "run",
                "py-wtf",
                "index",
                str(toplevel / "www" / "public" / "_index"),
                f"--project-name={proj}",
            )
            for proj in PROJECTS_TO_INDEX
        ]
    )

    os.chdir(toplevel / "www")
    await shell(NPM, "install")
    await shell(NPM, "run", "export")
    rev = await shell("git", "rev-parse", "HEAD")
    with TemporaryDirectory() as tmp_dir:
        tmp_out = Path(tmp_dir) / "docs"
        shutil.move("out", tmp_out)
        os.chdir(toplevel)
        await shell("git", "checkout", "pages")
        for i in ["docs/CNAME", "docs/.nojekyll"]:
            shutil.move(i, tmp_out)
        shutil.rmtree("docs")
        shutil.move(tmp_out, "docs")
    await shell("git", "add", "-A")
    await shell(
        "git",
        "commit",
        "-m",
        f"Deploy of {rev}",
        additional_env={"PRE_COMMIT_ALLOW_NO_CONFIG": "1"},
    )
    await shell("git", "push")
    await shell("git", "checkout", "-")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(levelname)s | %(message)s",
        datefmt="%I:%M:%S",
    )
    asyncio.run(main())
