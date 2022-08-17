# Copyright header thing here
"""
core module docs
"""


class Helper:
    some_variable: int = 2
    """docstring for some_variable"""

    class Utils:
        # Haha which class is this a comment for?
        class Common:
            def temporary_method(self) -> None:
                pass

        @staticmethod
        def static_method(foo: int) -> None:
            pass


def core_main(param: int | str) -> Helper:
    return Helper()
