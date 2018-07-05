"""Build a tree from vampire output."""

__all__ = ['build_tree']

import logging
import re

from example import example
from inference_node import InferenceNode

OUTPUT_PATTERN = re.compile('^([\d]+)\. (.*) ?\[(\D*) ?([\d,]*)\]$')


def build_tree(proof):
    nodes = {}
    roots = set()

    def add_as_child(node):
        if node.inference_rule == 'input':
            roots.add(node)
        else:
            for parent in node.parents:
                nodes[parent].children.add(node.number)

    for line in reversed(proof.split('\n')):
        try:
            params = parse(line)
            inference_node = InferenceNode(*params)
            nodes[inference_node.number] = inference_node
            add_as_child(inference_node)
        except AttributeError:
            logging.error(
                "Line '{}' is invalid and cannot be parsed".format(line)
            )
            pass
    return nodes


def parse(line):
    """Parse a line of vampire output.

    CAUTION: This method is very slow!
    TODO: Determine whether performance improvements are necessary.

    :param line: A line of vampire output
    :return: the clause number,
             clause,
             inference rule used to derive the clause
             and a set of lines the clause was derived from
    """
    number, clause, rule, parents = re.match(OUTPUT_PATTERN, line).groups()
    number = int(number)
    clause = clause.rstrip()
    rule = rule.rstrip()
    parents = {int(parent) for parent in parents.split(',') if parent}
    return number, clause, rule, parents


print(build_tree(example))
