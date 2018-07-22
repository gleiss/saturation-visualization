"""A Vampire output parser"""

__all__ = 'parse', 'parse_line'

import logging
import re

from presenter.parsing.inference_node import InferenceNode
from presenter.tree import Tree

LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN = re.compile(r'^\[SA\] active: ([\d]+)\. (.*) ?\[(\D*) ?([\d,]*)\]$')


def parse(vampire_output):
    """Build a tree from vampire output.

    :param str vampire_output: vampire proof output
    :return: the created tree
    :rtype: Tree
    """

    def add_as_child(node):
        for parent in node.parents:
            try:
                nodes[parent].children.add(node.number)
            except KeyError:
                orphan_nodes.setdefault(parent, set()).add(node.number)

    nodes = {}
    orphan_nodes = {}
    lines = vampire_output.split('\n')
    for line in reversed(lines):
        try:
            current_node = parse_line(line)
            current_node.children |= orphan_nodes.pop(current_node.number, set())
            nodes[current_node.number] = current_node
            add_as_child(current_node)
        except AttributeError:
            LOG.error("Line '%s' is invalid and cannot be parsed", line)

    leaves = {node for node in nodes.values() if not node.children}
    return Tree(nodes, leaves)


def parse_line(line):
    """Parse a line of vampire output.

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
