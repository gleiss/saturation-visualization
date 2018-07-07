"""TODO"""

__all__ = 'count_repr', 'title_repr', 'set_repr', 'separator', 'last_line'

BORDER = "="
SEPARATOR = "-"
LINE_LENGTH = 50


def count_repr(container, singular, plural):
    count = len(container)
    return "{} {}".format(count, singular if count == 1 else plural)


def title_repr(string):
    title_format = "{{:{}^{}}}".format(BORDER, LINE_LENGTH)
    return title_format.format(" {} ".format(string))


def set_repr(set_):
    return set_ if set_ else "-"


def separator():
    return SEPARATOR * LINE_LENGTH


def last_line():
    return BORDER * LINE_LENGTH
