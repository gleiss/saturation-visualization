"""A Vampire output parser"""

__all__ = 'parse', 'parse_line'

import logging
import re

from inference_node import InferenceNode
from tree import Tree

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN = re.compile('^([\d]+)\. (.*) ?\[(\D*) ?([\d,]*)\]$')


def parse(vampire_output):
    """Build a tree from vampire output.

    :param str vampire_output: vampire proof output
    :return: the created tree
    :rtype: Tree
    """

    def add_as_child(node):
        for parent in node.parents:
            nodes[parent].children.add(node.number)

    nodes = {}
    lines = vampire_output.split('\n')
    for line in reversed(lines):
        try:
            current_node = parse_line(line)
            nodes[current_node.number] = current_node
            add_as_child(current_node)
        except AttributeError:
            LOG.error("Line '%s' is invalid and cannot be parsed", line)

    leaves = {node for node in nodes.values() if not node.children}
    return Tree(nodes, leaves)


def parse_line(line):
    """Parse a line of vampire output.

    CAUTION: This method is very slow!
    TODO: Improve performance if necessary.

    :param str line: a line of vampire output
    :return: the line converted into a node
    :rtype: InferenceNode
    """
    number, clause, rule, parents = re.match(OUTPUT_PATTERN, line).groups()
    number = int(number)
    clause = clause.rstrip()
    rule = rule.rstrip()
    parents = {int(parent) for parent in parents.split(',') if parent}
    return InferenceNode(number, clause, rule, parents)
