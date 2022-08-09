# py.wtf

[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/zsol/py.wtf/main.svg)](https://results.pre-commit.ci/latest/github/zsol/py.wtf/main)

---

**Table of Contents**

- [Installation](#installation)
- [License](#license)

## Installation

Just don't.

## Hacking

Please do. Python 3.10, Node 16.14.

```shell
cd py.wtf
pipx run hatch shell
YOUR_FAVORITE_PACKAGE=click
py-wtf index --package-name $YOUR_FAVORITE_PACKAGE index/
cd www
npm install
npm run dev
```

## License

`py-wtf` is distributed under the terms of the [MIT](https://spdx.org/licenses/MIT.html) license.
